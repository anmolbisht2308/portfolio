"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Cursor = dynamic(() => import("./Cursor"), { ssr: false });

/**
 * The custom cursor (and the Motion runtime it uses) only ever loads on
 * fine-pointer devices without reduced motion, after the page is idle,
 * so it never weighs on first load or on touch devices.
 */
export default function CursorMount() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = () => setReady(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(start, 800);
    return () => clearTimeout(id);
  }, []);
  return ready ? <Cursor /> : null;
}
