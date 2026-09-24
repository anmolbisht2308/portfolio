"use client";
/* eslint-disable react-hooks/immutability --
   R3F idiom: instance buffers, the camera and scratch objects are mutated
   imperatively inside useFrame/effects by design. */

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clamp01 } from "@/lib/motion";
import { LEVEL_HEX, PEAK_HEX, type Cell } from "./calendar";

const LEVEL_COLORS = LEVEL_HEX.map((c) => new THREE.Color(c));
const PEAK_COLOR = new THREE.Color(PEAK_HEX);
const MAX_H = 3.4;
const GAP = 1.0;

type Props = {
  cells: Cell[];
  /** Animation key: bump to replay the rise (year change). */
  playKey: number;
  running: boolean;
  still: boolean;
  onHover: (cell: Cell | null, x: number, y: number) => void;
};

const WEEKS = 54;
const CAPACITY = WEEKS * 7;

function Bars({ cells, playKey, still, onHover }: Omit<Props, "running">) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const { camera, size, invalidate } = useThree();

  const maxCount = useMemo(() => Math.max(1, ...cells.map((c) => c.count)), [cells]);

  /* Per-slot animation state (slot = week*7 + weekday, stable across years
     so bars morph from last year's heights to this year's). */
  const anim = useMemo(
    () => ({
      from: new Float32Array(CAPACITY),
      to: new Float32Array(CAPACITY),
      cur: new Float32Array(CAPACITY),
      fromCol: Array.from({ length: CAPACITY }, () => LEVEL_COLORS[0].clone()),
      toCol: Array.from({ length: CAPACITY }, () => LEVEL_COLORS[0].clone()),
      delay: new Float32Array(CAPACITY),
      present: new Uint8Array(CAPACITY),
      start: -1,
      hovered: -1,
      lift: new Float32Array(CAPACITY),
      m: new THREE.Matrix4(),
      c: new THREE.Color(),
      pos: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      s: new THREE.Vector3(),
      bySlot: new Map<number, Cell>(),
    }),
    [],
  );

  const geometry = useMemo(() => new THREE.BoxGeometry(0.8, 1, 0.8).translate(0, 0.5, 0), []);
  const material = useMemo(() => new THREE.MeshLambertMaterial(), []);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  // New data (or replay): snapshot current state as "from", set targets.
  useEffect(() => {
    const a = anim;
    a.bySlot.clear();
    a.present.fill(0);
    for (const c of cells) {
      const slot = c.week * 7 + c.weekday;
      a.bySlot.set(slot, c);
      a.present[slot] = 1;
    }
    for (let slot = 0; slot < CAPACITY; slot++) {
      const c = a.bySlot.get(slot);
      a.from[slot] = a.cur[slot];
      a.fromCol[slot].copy(a.toCol[slot]);
      a.to[slot] = !c ? 0 : c.count === 0 ? 0.08 : 0.3 + Math.sqrt(c.count / maxCount) * (MAX_H - 0.3);
      a.toCol[slot].copy(
        !c ? LEVEL_COLORS[0] : c.count > 0 && c.count === maxCount ? PEAK_COLOR : LEVEL_COLORS[c.level],
      );
      // A wave that rolls through the year, week by week.
      a.delay[slot] = Math.floor(slot / 7) * 0.02 + (slot % 7) * 0.035;
    }
    a.start = -1; // (re)start on the next frame
    invalidate(); // frameloop="demand" (reduced motion) needs an explicit redraw
  }, [cells, maxCount, playKey, anim, invalidate]);

  // Big static bounding sphere: raycasting stays correct while bars animate.
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    m.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, MAX_H / 2, 0), 40);
    // Create the instance colour buffer before the first render so the
    // material compiles with per-instance colours from the start.
    for (let i = 0; i < CAPACITY; i++) m.setColorAt(i, LEVEL_COLORS[0]);
  }, []);

  /* Framing: landscape views the grid from the front so weeks run
     left→right; portrait views it from the side (camera on +X) so the same
     weeks run top→bottom and fill a tall frame. The ortho zoom fits the
     grid's projected bounds either way. */
  useEffect(() => {
    const g = group.current;
    const cam = camera as THREE.OrthographicCamera;
    if (!g) return;
    const portrait = size.width / size.height < 0.9;
    g.rotation.set(0, 0, 0);
    if (portrait) cam.position.set(30, 30, 9);
    else cam.position.set(10, 24, 30);
    cam.lookAt(0, 0.8, 0);
    cam.updateMatrixWorld();
    g.updateMatrixWorld();

    const half = { x: (WEEKS * GAP) / 2, z: (7 * GAP) / 2 };
    const corners: THREE.Vector3[] = [];
    for (const x of [-half.x, half.x])
      for (const y of [0, MAX_H]) for (const z of [-half.z, half.z]) corners.push(new THREE.Vector3(x, y, z));
    const inv = cam.matrixWorldInverse;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity; // prettier-ignore
    for (const c of corners) {
      const v = c.applyMatrix4(g.matrixWorld).applyMatrix4(inv);
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
    }
    cam.zoom = Math.min(size.width / (maxX - minX), size.height / (maxY - minY)) * 0.94;
    // Re-centre: shift the camera within its own plane onto the bounds' middle.
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    cam.position.addScaledVector(right, (minX + maxX) / 2).addScaledVector(up, (minY + maxY) / 2);
    cam.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, invalidate]);

  useFrame((state, dt) => {
    const m = mesh.current;
    if (!m) return;
    const a = anim;
    const t = state.clock.elapsedTime;
    if (a.start < 0) a.start = t;
    const since = t - a.start;
    const x0 = (-(WEEKS - 1) * GAP) / 2;
    const z0 = (-(7 - 1) * GAP) / 2;
    // Scan line sweeping across the weeks once the rise has settled.
    const sweep = still ? -99 : ((t * 0.12) % 1.5) * WEEKS - 8;
    const settle = still ? 0 : clamp01((since - 1.6) / 0.8);

    for (let slot = 0; slot < CAPACITY; slot++) {
      const p = still ? 1 : clamp01((since - a.delay[slot]) / 0.9);
      // expo-out rise with a hint of overshoot (the "ack" feel)
      const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p) + Math.sin(p * Math.PI) * 0.06;
      a.cur[slot] = a.from[slot] + (a.to[slot] - a.from[slot]) * e;

      const hovered = slot === a.hovered;
      a.lift[slot] += ((hovered ? 0.35 : 0) - a.lift[slot]) * Math.min(1, dt * 12);
      const week = Math.floor(slot / 7);
      const h = Math.max(0.0001, a.cur[slot]) + (a.present[slot] ? a.lift[slot] : 0);
      a.pos.set(x0 + week * GAP, 0, z0 + (slot % 7) * GAP);
      a.s.set(1, a.present[slot] || a.cur[slot] > 0.01 ? h : 0.0001, 1);
      a.m.compose(a.pos, a.q, a.s);
      m.setMatrixAt(slot, a.m);

      a.c.copy(a.fromCol[slot]).lerp(a.toCol[slot], p);
      const d = week - sweep;
      const boost = settle * Math.exp(-(d * d) / 6) * 0.55 + (hovered ? 0.6 : 0);
      if (boost > 0.001) a.c.multiplyScalar(1 + boost);
      m.setColorAt(slot, a.c);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;

    // Idle drift: the whole year breathes a little.
    if (group.current && !still) {
      const portrait = size.width / size.height < 0.9;
      group.current.rotation.y = Math.sin(t * 0.25) * (portrait ? 0.02 : 0.035);
    }
  });

  const pick = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const slot = e.instanceId ?? -1;
    const cell = anim.bySlot.get(slot) ?? null;
    anim.hovered = cell ? slot : -1;
    onHover(cell, e.nativeEvent.clientX, e.nativeEvent.clientY);
    invalidate();
  };

  return (
    <group ref={group}>
      <instancedMesh
        ref={mesh}
        args={[geometry, material, CAPACITY]}
        frustumCulled={false}
        onPointerMove={pick}
        onPointerDown={pick}
        onPointerOut={() => {
          anim.hovered = -1;
          onHover(null, 0, 0);
          invalidate();
        }}
      />
      {/* Ground plate */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]}>
        <planeGeometry args={[WEEKS * GAP + 1.4, 7 * GAP + 1.4]} />
        <meshBasicMaterial color="#0e1124" />
      </mesh>
    </group>
  );
}

/** Lazily loaded WebGL view (ssr: false). */
export default function ContributionsCanvas({ running, still, ...props }: Props) {
  return (
    <Canvas
      orthographic
      frameloop={still ? "demand" : running ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [14, 26, 30], zoom: 20, near: -200, far: 400 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[-12, 30, 18]} intensity={2.2} />
      <directionalLight position={[20, 6, -10]} intensity={0.5} color="#7c9cff" />
      <Bars still={still} {...props} />
    </Canvas>
  );
}
