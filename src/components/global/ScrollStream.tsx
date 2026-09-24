"use client";

import { useRef } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";

/**
 * Scroll progress as a data stream: a hairline "wire" with a glowing packet
 * riding it and a dashed trail of data behind. Vertical on the right edge
 * (desktop), horizontal along the top on small screens.
 */
export default function ScrollStream() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => el.style.setProperty("--p", self.progress.toFixed(4)),
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none fixed z-50 [--p:0]">
      {/* Desktop: vertical wire */}
      <div className="fixed top-1/2 right-5 hidden h-[40vh] w-px -translate-y-1/2 bg-line/70 md:block">
        <div
          className="absolute inset-x-0 top-0 origin-top"
          style={{
            height: "100%",
            transform: "scaleY(var(--p))",
            backgroundImage: "repeating-linear-gradient(to bottom, var(--color-signal) 0 6px, transparent 6px 10px)",
          }}
        />
        <div
          className="absolute left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal-core shadow-[0_0_12px_2px_var(--color-signal)]"
          style={{ top: "calc(var(--p) * 100%)" }}
        />
      </div>
      {/* Mobile: horizontal wire */}
      <div className="fixed inset-x-0 top-0 h-px bg-line/50 md:hidden">
        <div
          className="h-full origin-left bg-gradient-to-r from-signal to-signal-core"
          style={{ transform: "scaleX(var(--p))" }}
        />
      </div>
    </div>
  );
}
