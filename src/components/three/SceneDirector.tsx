"use client";

import { useEffect } from "react";
import { setSceneInView } from "./scene-store";

/**
 * Watches every `[data-scene]` section and tells the shared canvas whether it
 * is needed. Outside those sections the WebGL loop is fully stopped.
 */
export default function SceneDirector() {
  useEffect(() => {
    const visible = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      setSceneInView(visible.size > 0);
    });
    document.querySelectorAll("[data-scene]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
