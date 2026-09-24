"use client";
/* eslint-disable react-hooks/immutability --
   R3F idiom: GPU buffers, uniforms and the camera are mutated imperatively
   inside useFrame/effects by design; nothing here feeds React rendering. */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clamp01, easeInOutCubic, lerp } from "@/lib/motion";
import { buildGraph, mulberry32 } from "./graph";
import { sceneState } from "./scene-store";

/* Brand colours in linear space for the shaders. */
const SIGNAL = new THREE.Color("#7c9cff");
const SIGNAL_CORE = new THREE.Color("#c3d0ff");
const EMBER = new THREE.Color("#ff9b6a");

type Props = {
  nodeCount: number;
  packetCount: number;
  dustCount: number;
  /** Render a single, motionless frame (prefers-reduced-motion). */
  still?: boolean;
};

/* ── Shaders ──────────────────────────────────────────────────────────────
   Nodes and packets are GL points with a soft radial falloff. Additive
   blending lets overlapping glows bloom naturally even without post FX.   */

const nodeVert = /* glsl */ `
  attribute float aSize;
  attribute float aPulse;
  attribute float aWarm;
  uniform float uPixelRatio;
  uniform float uScale;
  varying float vPulse;
  varying float vWarm;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * (1.0 + aPulse * 1.1) * uPixelRatio * uScale / -mv.z;
    vPulse = aPulse;
    vWarm = aWarm;
  }
`;

const nodeFrag = /* glsl */ `
  uniform vec3 uCool;
  uniform vec3 uCore;
  uniform vec3 uWarm;
  uniform float uOpacity;
  varying float vPulse;
  varying float vWarm;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = smoothstep(0.16, 0.0, d);
    float halo = pow(smoothstep(0.5, 0.0, d), 2.2);
    vec3 base = mix(uCool, uCore, core);
    vec3 col = mix(base, uWarm, vWarm * vPulse);
    float a = (core + halo * (0.45 + vPulse * 0.6)) * uOpacity;
    gl_FragColor = vec4(col * (1.0 + vPulse * 0.8), a);
  }
`;

const packetVert = /* glsl */ `
  attribute float aWarm;
  attribute float aAlpha;
  uniform float uPixelRatio;
  uniform float uScale;
  uniform float uSize;
  varying float vWarm;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (1.0 + aWarm * 0.5) * uPixelRatio * uScale / -mv.z;
    vWarm = aWarm;
    vAlpha = aAlpha;
  }
`;

const packetFrag = /* glsl */ `
  uniform vec3 uCool;
  uniform vec3 uWarm;
  uniform float uOpacity;
  varying float vWarm;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = pow(smoothstep(0.5, 0.0, d), 1.6);
    gl_FragColor = vec4(mix(uCool, uWarm, vWarm) * 1.6, a * vAlpha * uOpacity);
  }
`;

type Packet = {
  edge: number;
  /** travelling a→b (0) or b→a (1) */
  dir: 0 | 1;
  t: number;
  speed: number;
  warm: boolean;
};

export default function NetworkScene({ nodeCount, packetCount, dustCount, still = false }: Props) {
  const { camera, size, gl } = useThree();
  const graph = useMemo(() => buildGraph(nodeCount), [nodeCount]);

  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const dustRef = useRef<THREE.Points>(null);

  /* ── Geometry buffers (mutated in place every frame) ─────────────────── */
  const buffers = useMemo(() => {
    const n = graph.count;
    const edgeCount = graph.edges.length / 2;
    const rand = mulberry32(3);

    const nodePos = new Float32Array(n * 3);
    nodePos.set(graph.shell);
    const nodeSize = new Float32Array(n);
    for (let i = 0; i < n; i++) nodeSize[i] = graph.hub[i] ? 170 : 70 + graph.seed[i] * 50;

    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3).setUsage(THREE.DynamicDrawUsage));
    nodeGeo.setAttribute("aSize", new THREE.BufferAttribute(nodeSize, 1));
    nodeGeo.setAttribute("aPulse", new THREE.BufferAttribute(new Float32Array(n), 1).setUsage(THREE.DynamicDrawUsage));
    nodeGeo.setAttribute("aWarm", new THREE.BufferAttribute(new Float32Array(n), 1).setUsage(THREE.DynamicDrawUsage));

    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(edgeCount * 6), 3).setUsage(THREE.DynamicDrawUsage),
    );

    const packets: Packet[] = Array.from({ length: packetCount }, () => ({
      edge: Math.floor(rand() * edgeCount),
      dir: rand() > 0.5 ? 1 : 0,
      t: rand(),
      speed: 0.35 + rand() * 0.6,
      // ~1 in 10 packets is a warm "human" message; the rest are data.
      warm: rand() < 0.1,
    }));
    const packetGeo = new THREE.BufferGeometry();
    packetGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(packetCount * 3), 3).setUsage(THREE.DynamicDrawUsage),
    );
    packetGeo.setAttribute(
      "aWarm",
      new THREE.BufferAttribute(
        Float32Array.from(packets, (p) => (p.warm ? 1 : 0)),
        1,
      ),
    );
    packetGeo.setAttribute(
      "aAlpha",
      new THREE.BufferAttribute(new Float32Array(packetCount).fill(1), 1).setUsage(THREE.DynamicDrawUsage),
    );

    // Background dust: a distant, sparse starfield for depth.
    const dust = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      const r = 7 + rand() * 10;
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(2 * rand() - 1);
      dust[i * 3] = r * Math.sin(ph) * Math.cos(th);
      dust[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.6;
      dust[i * 3 + 2] = r * Math.cos(ph) - 4;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dust, 3));

    return { nodePos, nodeGeo, edgeGeo, packetGeo, dustGeo, packets, edgeCount, rand };
  }, [graph, packetCount, dustCount]);

  /* ── Materials ───────────────────────────────────────────────────────── */
  const materials = useMemo(() => {
    const pr = Math.min(gl.getPixelRatio(), 2);
    const node = new THREE.ShaderMaterial({
      vertexShader: nodeVert,
      fragmentShader: nodeFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uPixelRatio: { value: pr },
        uScale: { value: 1 },
        uCool: { value: SIGNAL.clone() },
        uCore: { value: SIGNAL_CORE.clone() },
        uWarm: { value: EMBER.clone() },
        uOpacity: { value: 1 },
      },
    });
    const packet = new THREE.ShaderMaterial({
      vertexShader: packetVert,
      fragmentShader: packetFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uPixelRatio: { value: pr },
        uScale: { value: 1 },
        uSize: { value: 38 },
        uCool: { value: SIGNAL_CORE.clone() },
        uWarm: { value: EMBER.clone() },
        uOpacity: { value: 1 },
      },
    });
    const edge = new THREE.LineBasicMaterial({
      color: SIGNAL,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.PointsMaterial({
      color: "#7a80a3",
      size: 0.035,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    return { node, packet, edge, dust };
  }, [gl]);

  // Dispose GPU resources when counts change or the scene unmounts.
  useEffect(() => {
    const { nodeGeo, edgeGeo, packetGeo, dustGeo } = buffers;
    return () => {
      nodeGeo.dispose();
      edgeGeo.dispose();
      packetGeo.dispose();
      dustGeo.dispose();
    };
  }, [buffers]);
  useEffect(() => {
    return () => Object.values(materials).forEach((m) => m.dispose());
  }, [materials]);

  // Point sizes are authored for a ~900px tall viewport.
  useEffect(() => {
    const s = size.height / 900;
    materials.node.uniforms.uScale.value = s;
    materials.packet.uniforms.uScale.value = s;
  }, [size.height, materials]);

  /* ── Per-frame scratch objects (never allocate inside useFrame) ──────── */
  const scratch = useMemo(
    () => ({
      raycaster: new THREE.Raycaster(),
      plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
      ndc: new THREE.Vector2(),
      hit: new THREE.Vector3(),
      local: new THREE.Vector3(),
      attract: 0,
      spin: 0,
      smoothPointer: { x: 0, y: 0 },
      dolly: 0,
      calm: 0,
      converge: 0,
    }),
    [],
  );

  useFrame((state, rawDelta) => {
    const o = outer.current;
    const g = inner.current;
    if (!o || !g) return;
    // Clamp delta so returning to a background tab doesn't teleport packets.
    const dt = still ? 0 : Math.min(rawDelta, 1 / 20);
    const time = still ? 0 : state.clock.elapsedTime;
    const s = scratch;

    // Smooth the scroll-driven inputs so scrubbing never feels steppy.
    const k = still ? 1 : 1 - Math.pow(0.001, dt);
    s.dolly = lerp(s.dolly, sceneState.dolly, k);
    s.calm = lerp(s.calm, sceneState.calm, k);
    s.converge = lerp(s.converge, sceneState.converge, k);
    const converge = easeInOutCubic(clamp01(s.converge));

    /* Layout: offset right on wide screens so the headline has room. */
    const aspect = size.width / size.height;
    const wide = aspect > 1.15;
    const scale = THREE.MathUtils.clamp(aspect * 0.85, 0.62, 1);
    o.position.x = lerp(wide ? 1.9 : 0, 0, converge);
    o.position.y = lerp(wide ? 0 : 1.5, 0, converge);
    o.scale.setScalar(scale);

    /* Camera: dolly-in on scroll. */
    const cam = camera as THREE.PerspectiveCamera;
    // …then eases back out as the network calms (About), framing the ring.
    cam.position.z = lerp(10, 6.2, easeInOutCubic(clamp01(s.dolly))) + s.calm * 2.6;

    /* Rotation + cursor parallax. */
    s.spin += dt * 0.06 * (1 - s.calm * 0.7) * (1 - converge);
    const p = sceneState.pointer;
    s.smoothPointer.x = lerp(s.smoothPointer.x, p.x, 1 - Math.pow(0.02, dt));
    s.smoothPointer.y = lerp(s.smoothPointer.y, p.y, 1 - Math.pow(0.02, dt));
    g.rotation.y = s.spin + s.smoothPointer.x * 0.28;
    g.rotation.x = -s.smoothPointer.y * 0.16 + s.calm * 0.35;

    /* Pointer in the network's local space (for attraction). */
    s.attract = lerp(s.attract, p.active && !still ? 1 : 0, 1 - Math.pow(0.05, dt));
    let hasPointer = false;
    if (s.attract > 0.01) {
      s.ndc.set(p.x, p.y);
      s.raycaster.setFromCamera(s.ndc, cam);
      if (s.raycaster.ray.intersectPlane(s.plane, s.hit)) {
        g.updateWorldMatrix(true, false);
        s.local.copy(s.hit);
        g.worldToLocal(s.local);
        hasPointer = true;
      }
    }

    /* ── Nodes: blend forms, breathe, attract, decay pulses ─────────── */
    const { nodePos, nodeGeo, edgeGeo, packetGeo, packets, edgeCount, rand } = buffers;
    const pulse = nodeGeo.attributes.aPulse.array as Float32Array;
    const warm = nodeGeo.attributes.aWarm.array as Float32Array;
    const R = 1.7;
    for (let i = 0; i < graph.count; i++) {
      const i3 = i * 3;
      const breathe = Math.sin(time * 0.8 + graph.seed[i] * 6.28) * 0.06 * (1 - s.calm * 0.5);
      let x = lerp(graph.shell[i3], graph.ring[i3], s.calm);
      let y = lerp(graph.shell[i3 + 1], graph.ring[i3 + 1], s.calm) + breathe;
      let z = lerp(graph.shell[i3 + 2], graph.ring[i3 + 2], s.calm);
      // Converge on the origin: that's where the CTA node lives.
      const c = 1 - converge;
      x *= c;
      y *= c;
      z *= c;

      if (hasPointer) {
        const dx = s.local.x - x;
        const dy = s.local.y - y;
        const dz = s.local.z - z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < R) {
          const f = (1 - d / R) ** 2 * 0.32 * s.attract;
          x += dx * f;
          y += dy * f;
          z += dz * f;
          pulse[i] = Math.max(pulse[i], f * 1.6);
        }
      }
      nodePos[i3] = x;
      nodePos[i3 + 1] = y;
      nodePos[i3 + 2] = z;
      pulse[i] *= Math.pow(0.12, dt); // exponential ack decay
      // Converged: the single CTA node breathes like a live connection.
      if (converge > 0.85 && graph.hub[i]) {
        pulse[i] = Math.max(pulse[i], (0.5 + 0.5 * Math.sin(time * 2.2)) * 0.7 * converge);
        warm[i] = converge;
      }
    }
    nodeGeo.attributes.position.needsUpdate = true;
    nodeGeo.attributes.aPulse.needsUpdate = true;
    nodeGeo.attributes.aWarm.needsUpdate = true;

    /* ── Edges follow the (displaced) nodes ─────────────────────────── */
    const ep = edgeGeo.attributes.position.array as Float32Array;
    for (let e = 0; e < edgeCount; e++) {
      const a = graph.edges[e * 2] * 3;
      const b = graph.edges[e * 2 + 1] * 3;
      ep[e * 6] = nodePos[a];
      ep[e * 6 + 1] = nodePos[a + 1];
      ep[e * 6 + 2] = nodePos[a + 2];
      ep[e * 6 + 3] = nodePos[b];
      ep[e * 6 + 4] = nodePos[b + 1];
      ep[e * 6 + 5] = nodePos[b + 2];
    }
    edgeGeo.attributes.position.needsUpdate = true;

    /* ── Packets hop edge → edge like messages being routed ─────────── */
    const pp = packetGeo.attributes.position.array as Float32Array;
    const pa = packetGeo.attributes.aAlpha.array as Float32Array;
    const speedScale = (1 - s.calm * 0.6) * (1 - converge * 0.5);
    // Fewer packets in flight as the network calms.
    const live = Math.max(1, Math.floor(packets.length * (1 - s.calm * 0.55)));
    for (let i = 0; i < packets.length; i++) {
      const pk = packets[i];
      pk.t += dt * pk.speed * speedScale;
      if (pk.t >= 1) {
        // Arrived: ack the destination node, then route onwards.
        const dest = graph.edges[pk.edge * 2 + (pk.dir ? 0 : 1)];
        pulse[dest] = 1;
        warm[dest] = pk.warm ? 1 : Math.max(0, warm[dest] - 0.5);
        const options = graph.adjacency[dest];
        let next = options[Math.floor(rand() * options.length)];
        if (next === pk.edge && options.length > 1) next = options[(options.indexOf(next) + 1) % options.length];
        pk.edge = next;
        pk.dir = graph.edges[next * 2] === dest ? 0 : 1;
        pk.t -= 1;
      }
      const from = graph.edges[pk.edge * 2 + pk.dir] * 3;
      const to = graph.edges[pk.edge * 2 + (1 - pk.dir)] * 3;
      const t = easeInOutCubic(pk.t);
      pp[i * 3] = lerp(nodePos[from], nodePos[to], t);
      pp[i * 3 + 1] = lerp(nodePos[from + 1], nodePos[to + 1], t);
      pp[i * 3 + 2] = lerp(nodePos[from + 2], nodePos[to + 2], t);
      // Fade in/out at each hop so packets "leave" and "arrive" softly.
      const hop = Math.sin(Math.PI * pk.t);
      pa[i] = i < live ? 0.25 + hop * 0.75 : 0;
    }
    packetGeo.attributes.position.needsUpdate = true;
    packetGeo.attributes.aAlpha.needsUpdate = true;

    /* Fade the lattice as it calms/converges; the CTA node takes over. */
    materials.edge.opacity = 0.16 * (1 - s.calm * 0.35) * (1 - converge);
    // While calm (About, where the portrait is the focus) the network steps
    // back to an ambient layer; converging (Contact) brings the node back up.
    const ambient = 1 - s.calm * 0.55 * (1 - converge);
    materials.packet.uniforms.uOpacity.value = (1 - converge) * ambient;
    materials.node.uniforms.uOpacity.value = ambient;

    if (dustRef.current) dustRef.current.rotation.y = time * 0.01;
  });

  return (
    <>
      <points ref={dustRef} geometry={buffers.dustGeo} material={materials.dust} />
      <group ref={outer}>
        <group ref={inner}>
          <lineSegments geometry={buffers.edgeGeo} material={materials.edge} frustumCulled={false} />
          <points geometry={buffers.packetGeo} material={materials.packet} frustumCulled={false} />
          <points geometry={buffers.nodeGeo} material={materials.node} frustumCulled={false} />
        </group>
      </group>
    </>
  );
}
