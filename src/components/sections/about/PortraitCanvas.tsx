"use client";
/* eslint-disable react-hooks/immutability --
   R3F idiom: uniforms and the group transform are mutated inside useFrame. */

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { mulberry32 } from "@/components/three/graph";
import { detectTier, type Tier } from "@/lib/device-tier";

/** Mutable, render-free handle the About timeline writes into (0 → 1). */
export type PortraitState = { progress: number; hover: boolean };

const GRID: Record<Tier, number> = { high: 190, mid: 150, low: 110 };

/*
 * Each point samples the photo (colour) and a depth map (relief + mask) in
 * the vertex shader. Points outside the silhouette collapse to nothing.
 * `uProgress` flies every point in from a scattered "packet cloud" with a
 * per-point stagger (top of the head first), so the portrait literally
 * assembles out of data as you scroll.
 */
const vert = /* glsl */ `
  uniform sampler2D uDepth;
  uniform float uProgress;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec2 uPointer;
  uniform float uPointerActive;
  attribute vec2 aUv;
  attribute vec3 aScatter;
  attribute float aRand;
  varying vec2 vUv;
  varying float vDepth;
  varying float vRipple;
  varying float vArrive;

  void main() {
    vUv = aUv;
    float d = texture2D(uDepth, aUv).r;
    vDepth = d;

    // Top-down stagger with some randomness so it streams rather than wipes.
    float delay = (1.0 - aUv.y) * 0.45 + aRand * 0.3;
    float p = clamp((uProgress - delay) / 0.35, 0.0, 1.0);
    float e = 1.0 - pow(2.0, -10.0 * p);            // expo-out arrival
    vArrive = e;

    vec3 target = vec3((aUv.x - 0.5) * 2.0, (aUv.y - 0.5) * 2.0, d * 0.55);
    target.z += sin(uTime * 1.3 + aRand * 6.2831) * 0.004;   // breathing

    // Hologram ripple around the pointer.
    float dist = distance(aUv, uPointer);
    float ripple = uPointerActive * exp(-dist * dist / 0.006) * (0.6 + 0.4 * sin(uTime * 6.0 - dist * 60.0));
    target.z += ripple * 0.12;
    vRipple = ripple;

    vec3 pos = mix(aScatter, target, e);
    // Curved flight path: packets arc in rather than travelling straight.
    pos.z += sin(e * 3.14159) * (0.35 + aRand * 0.35);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (1.0 + ripple * 0.8) * (0.55 + 0.45 * e) / -mv.z;
    if (d < 0.02) gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // clip (belt and braces)
  }
`;

const frag = /* glsl */ `
  uniform sampler2D uColor;
  uniform float uTime;
  uniform vec3 uSignal;
  uniform vec3 uCore;
  uniform vec3 uEmber;
  varying vec2 vUv;
  varying float vDepth;
  varying float vRipple;
  varying float vArrive;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25) discard;
    vec3 col = texture2D(uColor, vUv).rgb;

    // Grade into the site's palette: cooler in the recesses, and lift the
    // darks (black shirt, hair) toward indigo so they read on a dark page.
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, col * vec3(0.8, 0.88, 1.18), 0.4 * (1.0 - luma));
    col = max(col * 1.1, uSignal * 0.13);
    // Rim light where the relief falls away (silhouette edges).
    float rim = smoothstep(0.35, 0.05, vDepth);
    col += uSignal * rim * 0.45;
    // A data scan line sweeping down the portrait.
    float scan = smoothstep(0.018, 0.0, abs(fract(uTime * 0.12) * 1.3 - 0.15 - (1.0 - vUv.y)));
    col += uCore * scan * 0.35;
    // In-flight packets glow ember, settling into true colour on arrival.
    col = mix(uEmber * 1.2, col, vArrive);
    col += uCore * vRipple * 0.5;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

function Points({ stateRef, still }: { stateRef: RefObject<PortraitState>; still: boolean }) {
  const [color, depth] = useLoader(THREE.TextureLoader, ["/portrait/color.webp", "/portrait/depth.png"]);
  const { gl, size } = useThree();
  const group = useRef<THREE.Group>(null);
  const tier = useMemo(() => detectTier(), []);
  const n = GRID[tier];

  // Sample the depth map on the CPU once so points outside the silhouette
  // are never created (GPUs draw even 0-size points as 1px specks).
  const mask = useMemo(() => {
    const img = depth.image as CanvasImageSource & { width: number; height: number };
    const S = 256;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, S, S);
    const px = ctx.getImageData(0, 0, S, S).data;
    return (u: number, v: number) => {
      const x = Math.min(S - 1, Math.floor(u * S));
      const y = Math.min(S - 1, Math.floor((1 - v) * S)); // uv origin is bottom-left
      return px[(y * S + x) * 4] / 255;
    };
  }, [depth]);

  const geometry = useMemo(() => {
    const rand = mulberry32(42);
    const uv: number[] = [];
    const scatter: number[] = [];
    const r: number[] = [];
    for (let gy = 0; gy < n; gy++) {
      for (let gx = 0; gx < n; gx++) {
        // Jittered grid avoids moiré against the photo's pixels.
        const u = (gx + 0.5 + (rand() - 0.5) * 0.35) / n;
        const v = (gy + 0.5 + (rand() - 0.5) * 0.35) / n;
        const a = rand() * Math.PI * 2;
        const rad = 1.02 + (rand() - 0.5) * 0.1;
        const z = -0.15 - rand() * 0.5;
        const seed = rand();
        if (mask(u, v) < 0.04) continue;
        uv.push(u, v);
        // Start positions: packets riding the orbit ring drawn around the
        // portrait, so the face streams in from the network around it.
        scatter.push(Math.cos(a) * rad, Math.sin(a) * rad, z);
        r.push(seed);
      }
    }
    const count = r.length;
    const g = new THREE.BufferGeometry();
    // `position` is required by three; real positions come from the shader.
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aUv", new THREE.BufferAttribute(new Float32Array(uv), 2));
    g.setAttribute("aScatter", new THREE.BufferAttribute(new Float32Array(scatter), 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(new Float32Array(r), 1));
    return g;
  }, [n, mask]);

  const material = useMemo(() => {
    color.colorSpace = THREE.SRGBColorSpace;
    depth.colorSpace = THREE.NoColorSpace;
    return new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uColor: { value: color },
        uDepth: { value: depth },
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uSize: { value: 1 },
        uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
        uPointer: { value: new THREE.Vector2(-9, -9) },
        uPointerActive: { value: 0 },
        uSignal: { value: new THREE.Color("#7c9cff") },
        uCore: { value: new THREE.Color("#c3d0ff") },
        uEmber: { value: new THREE.Color("#ff9b6a") },
      },
    });
  }, [color, depth, gl]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  // Point size scales with the canvas so density looks the same at any size.
  useEffect(() => {
    // ≈1.6× the on-screen grid spacing so round points close the gaps.
    material.uniforms.uSize.value = (size.height / n) * 4.6;
  }, [size.height, n, material]);

  const smooth = useRef({ progress: 0, px: 0, py: 0, active: 0 });

  useFrame(({ clock, pointer }, dt) => {
    const u = material.uniforms;
    const s = smooth.current;
    const k = 1 - Math.pow(0.002, Math.min(dt, 0.05));
    s.progress += ((still ? 1 : stateRef.current.progress) * 1.25 - s.progress) * (still ? 1 : k);
    u.uProgress.value = s.progress;
    u.uTime.value = still ? 0 : clock.elapsedTime;

    // Pointer: R3F gives NDC over this canvas. Map to the portrait's uv.
    const over = stateRef.current.hover;
    s.active += ((over && !still ? 1 : 0) - s.active) * k;
    u.uPointerActive.value = s.active;
    u.uPointer.value.set(pointer.x * 0.5 + 0.5, pointer.y * 0.5 + 0.5);

    // Tilt toward the cursor, with a slow idle sway.
    const g = group.current;
    if (g && !still) {
      s.px += ((over ? pointer.x : 0) - s.px) * k;
      s.py += ((over ? pointer.y : 0) - s.py) * k;
      g.rotation.y = s.px * 0.45 + Math.sin(clock.elapsedTime * 0.35) * 0.08;
      g.rotation.x = -s.py * 0.2;
    }
  });

  return (
    <group ref={group}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}

/** Lazily loaded (ssr: false) WebGL portrait. */
export default function PortraitCanvas({
  stateRef,
  running,
  still,
  onReady,
}: {
  stateRef: RefObject<PortraitState>;
  running: boolean;
  still: boolean;
  onReady: () => void;
}) {
  return (
    <Canvas
      frameloop={still ? "demand" : running ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 3.1], fov: 40 }}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      onCreated={onReady}
    >
      <Suspense fallback={null}>
        <Points stateRef={stateRef} still={still} />
      </Suspense>
    </Canvas>
  );
}
