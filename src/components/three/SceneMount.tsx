"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import CanvasFallback from "./CanvasFallback";
import { hasWebGL } from "@/lib/webgl";

const SceneCanvas = dynamic(() => import("./SceneCanvas"), {
  ssr: false,
  loading: () => <CanvasFallback />,
});

const WAKE_EVENTS = ["pointermove", "pointerdown", "wheel", "touchstart", "keydown", "scroll"] as const;

/**
 * Defers the three.js chunk (and its shader compilation) until the visitor
 * first interacts, or a few seconds pass, so WebGL setup never competes
 * with first paint, hydration or the intro sequence. The CSS fallback glow
 * holds the space meanwhile and the canvas cross-fades in over it.
 */
export default function SceneMount() {
  const [mount, setMount] = useState(false);

  useEffect(() => {
    if (!hasWebGL()) return;
    let idle = 0;
    const start = () => {
      cleanup();
      // Yield one idle slot so the triggering interaction stays responsive.
      idle =
        typeof window.requestIdleCallback === "function"
          ? window.requestIdleCallback(() => setMount(true), { timeout: 400 })
          : window.setTimeout(() => setMount(true), 50);
    };
    // Desktop also wakes on a timer for visitors who just watch; touch devices
    // wake on their first touch/scroll, keeping mobile first load WebGL-free.
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const timer = fine ? window.setTimeout(start, 4500) : 0;
    const cleanup = () => {
      clearTimeout(timer);
      WAKE_EVENTS.forEach((e) => window.removeEventListener(e, start));
    };
    WAKE_EVENTS.forEach((e) => window.addEventListener(e, start, { once: true, passive: true }));
    return () => {
      cleanup();
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      clearTimeout(idle);
    };
  }, []);

  return mount ? <SceneCanvas /> : <CanvasFallback />;
}
