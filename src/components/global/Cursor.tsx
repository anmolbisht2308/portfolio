"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { SPRING } from "@/lib/motion";

type Mode = "default" | "link" | "text" | "hidden";

/**
 * A precise dot plus a lagging ring. Over interactive elements the ring grows
 * into a "connection" halo; `data-cursor="label"` elements show a mono label.
 * Only on fine pointers; native cursor stays for touch & reduced motion.
 */
export default function Cursor() {
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, SPRING.cursor);
  const ry = useSpring(y, SPRING.cursor);
  const [mode, setMode] = useState<Mode>("hidden");
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("has-cursor");

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = e.target as Element | null;
      const interactive = target?.closest<HTMLElement>(
        "a, button, [role='button'], input, textarea, select, [data-cursor]",
      );
      const labelled = target?.closest<HTMLElement>("[data-cursor-label]");
      setLabel(labelled?.dataset.cursorLabel ?? null);
      if (!interactive) setMode("default");
      else if (interactive.matches("input, textarea")) setMode("text");
      else setMode("link");
    };
    const onLeave = () => setMode("hidden");

    window.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const ring = {
    default: { width: 32, height: 32, opacity: 0.5, borderColor: "rgb(122 128 163 / 0.6)" },
    link: { width: 56, height: 56, opacity: 1, borderColor: "rgb(255 155 106 / 0.9)" },
    text: { width: 4, height: 28, opacity: 1, borderColor: "rgb(236 238 248 / 0.8)" },
    hidden: { width: 32, height: 32, opacity: 0, borderColor: "rgb(122 128 163 / 0)" },
  }[mode];

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90]">
      <motion.div
        className="absolute top-0 left-0 rounded-full border"
        style={{ x: rx, y: ry, translateX: "-50%", translateY: "-50%" }}
        animate={ring}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
      />
      <motion.div
        className="absolute top-0 left-0 size-1.5 rounded-full bg-hi"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: mode === "hidden" || mode === "text" ? 0 : 1, scale: mode === "link" ? 0.5 : 1 }}
        transition={{ duration: 0.15 }}
      />
      {label ? (
        <motion.span
          className="text-mono-label absolute top-0 left-0 rounded-full bg-ember px-2.5 py-1 text-void"
          style={{ x: rx, y: ry, translateX: "18px", translateY: "18px" }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {label}
        </motion.span>
      ) : null}
    </div>
  );
}
