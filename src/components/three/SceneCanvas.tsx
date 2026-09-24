"use client";

import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useState, useSyncExternalStore } from "react";
import { detectTier, stepDown, TIER_SETTINGS, type Tier } from "@/lib/device-tier";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import NetworkScene from "./NetworkScene";
import { sceneState, subscribeScene } from "./scene-store";

/** Tab visibility as an external store (pauses rendering when hidden). */
function subscribeVisibility(cb: () => void) {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}

/**
 * The one shared WebGL canvas. Fixed behind the page; sections tell it when
 * it's needed via `data-scene` (see SceneDirector). When no scene section is
 * on screen, or the tab is hidden, the render loop stops completely.
 */
export default function SceneCanvas() {
  const reduced = useReducedMotion();
  const [tier, setTier] = useState<Tier>(() => detectTier());
  const [ready, setReady] = useState(false);
  const settings = TIER_SETTINGS[tier];

  const inView = useSyncExternalStore(
    subscribeScene,
    () => sceneState.inView,
    () => true,
  );
  const tabVisible = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );

  // Pointer → normalised device coords. Canvas itself ignores pointer events.
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      sceneState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      sceneState.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      sceneState.pointer.active = true;
    };
    const onLeave = () => (sceneState.pointer.active = false);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced]);

  const running = inView && tabVisible;
  const frameloop = reduced ? "demand" : running ? "always" : "never";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-[1200ms] ease-(--ease-signal)"
      style={{ opacity: ready && inView ? 1 : 0 }}
    >
      <Canvas
        frameloop={frameloop}
        dpr={settings.dpr}
        camera={{ position: [0, 0, 10], fov: 45, near: 0.1, far: 60 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance", stencil: false }}
        onCreated={() => setReady(true)}
      >
        <PerformanceMonitor
          flipflops={2}
          onDecline={() => setTier((t) => stepDown(t))}
          onFallback={() => setTier("low")}
        />
        <NetworkScene
          key={tier /* rebuild buffers cleanly when quality changes */}
          nodeCount={settings.nodes}
          packetCount={settings.packets}
          dustCount={settings.dust}
          still={reduced}
        />
        {settings.bloom && !reduced ? (
          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur intensity={0.65} luminanceThreshold={0.18} luminanceSmoothing={0.35} />
          </EffectComposer>
        ) : null}
      </Canvas>
    </div>
  );
}
