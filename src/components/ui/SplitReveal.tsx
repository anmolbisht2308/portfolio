"use client";

import { useRef, type ReactNode } from "react";
import { gsap, PLAY_ONCE, SplitText, useGSAP } from "@/lib/gsap";
import { STAGGER } from "@/lib/motion";

/**
 * Scroll-triggered masked reveal using GSAP SplitText. Text streams in line
 * by line (or word by word) the first time it enters the viewport. Re-splits
 * automatically on resize/font load. Reduced motion → a plain fade.
 */
export default function SplitReveal({
  children,
  id,
  as: Tag = "p",
  by = "lines",
  className,
  start = "top 85%",
  delay = 0,
}: {
  children: ReactNode;
  id?: string;
  as?: "p" | "h2" | "h3" | "div";
  by?: "lines" | "words";
  className?: string;
  start?: string;
  delay?: number;
}) {
  // Intersection type so the ref fits whichever tag `as` renders.
  const ref = useRef<HTMLParagraphElement & HTMLHeadingElement & HTMLDivElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const el = ref.current;
      if (!el) return;
      let mm: gsap.MatchMedia | undefined;

      // Split lazily: only when the element comes within half a viewport of
      // the screen. Splitting every heading at hydration is one long,
      // layout-heavy task; this spreads the work out and keeps text intact
      // (and fully readable) until just before it's revealed.
      const init = contextSafe!(() => {
        mm = gsap.matchMedia();
        mm.add(
          { motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" },
          (ctx) => {
            if (ctx.conditions?.reduce) {
              gsap.from(el, {
                autoAlpha: 0,
                duration: 0.3,
                ease: "none",
                scrollTrigger: { trigger: el, start, ...PLAY_ONCE },
              });
              return;
            }
            SplitText.create(el, {
              type: by === "lines" ? "lines" : "words,lines",
              mask: by,
              autoSplit: true,
              // Keep the original text readable to assistive tech without
              // adding aria-label to elements where it's prohibited (e.g. <p>).
              aria: "none",
              linesClass: "split-line",
              onSplit: (self) =>
                gsap.from(by === "lines" ? self.lines : self.words, {
                  yPercent: 110,
                  duration: 1.1,
                  ease: "signal",
                  stagger: by === "lines" ? STAGGER.line : STAGGER.word,
                  delay,
                  scrollTrigger: { trigger: el, start, ...PLAY_ONCE },
                }),
            });
          },
        );
      });

      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          io.disconnect();
          init();
        },
        { rootMargin: "0px 0px 50% 0px" },
      );
      io.observe(el);
      return () => {
        io.disconnect();
        mm?.revert();
      };
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} id={id} className={className}>
      {children}
    </Tag>
  );
}
