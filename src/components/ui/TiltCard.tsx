"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * 3D tilt toward the pointer, a slight magnetic drift, and a soft light that
 * follows the cursor across the surface. Fine pointers only; springs via
 * GSAP quickTo so hovering never triggers React renders.
 */
export default function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const o = outer.current;
      const i = inner.current;
      if (!o || !i) return;
      if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const spring = { duration: 0.6, ease: "signal" };
      const rx = gsap.quickTo(i, "rotationX", spring);
      const ry = gsap.quickTo(i, "rotationY", spring);
      const tx = gsap.quickTo(o, "x", { duration: 0.8, ease: "elastic.out(1, 0.5)" });
      const ty = gsap.quickTo(o, "y", { duration: 0.8, ease: "elastic.out(1, 0.5)" });
      gsap.set(i, { transformPerspective: 1000 });

      const move = (e: PointerEvent) => {
        const r = o.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        ry((px - 0.5) * 10);
        rx(-(py - 0.5) * 8);
        tx((px - 0.5) * 10);
        ty((py - 0.5) * 10);
        i.style.setProperty("--lx", `${px * 100}%`);
        i.style.setProperty("--ly", `${py * 100}%`);
      };
      const leave = () => {
        rx(0);
        ry(0);
        tx(0);
        ty(0);
      };
      o.addEventListener("pointermove", move);
      o.addEventListener("pointerleave", leave);
      return () => {
        o.removeEventListener("pointermove", move);
        o.removeEventListener("pointerleave", leave);
      };
    },
    { scope: outer },
  );

  return (
    <div ref={outer} className={`group relative ${className}`}>
      <div ref={inner} className="relative h-full rounded-[inherit] [--lx:50%] [--ly:50%]">
        {children}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-(--dur-base) group-hover:opacity-100 motion-reduce:hidden"
          style={{
            background:
              "radial-gradient(420px circle at var(--lx) var(--ly), rgb(124 156 255 / 0.14), transparent 60%)",
          }}
        />
      </div>
    </div>
  );
}
