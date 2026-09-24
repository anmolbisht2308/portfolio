"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useLazyGSAP } from "@/lib/hooks/useLazyGSAP";

/**
 * Counts from `from` to `to` when scrolled into view. The final value is
 * server-rendered so it's correct without JS / for crawlers & screen readers.
 */
export default function Counter({
  to,
  from = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  to: number;
  from?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useLazyGSAP(
    () => {
      const el = ref.current;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const state = { v: from };
      // Only rewind to `from` if it's still below the fold (no visible jump).
      if (el.getBoundingClientRect().top > window.innerHeight) el.textContent = `${prefix}${from}${suffix}`;
      gsap.to(state, {
        v: to,
        duration: 1.6,
        ease: "signal",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => {
          el.textContent = `${prefix}${Math.round(state.v)}${suffix}`;
        },
      });
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className={className}>
      {prefix}
      {to}
      {suffix}
    </span>
  );
}
