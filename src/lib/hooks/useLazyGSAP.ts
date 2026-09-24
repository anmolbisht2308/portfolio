"use client";

import type { RefObject } from "react";
import { useGSAP } from "@/lib/gsap";

/**
 * useGSAP, deferred until the scope element comes within `rootMargin` of the
 * viewport. Creating tweens + ScrollTriggers forces layout; doing it for
 * every section at hydration is the single biggest main-thread cost on the
 * page. Deferring keeps start-up light and does the work just in time.
 *
 * Runs inside the useGSAP context (via contextSafe), so everything created
 * is reverted on unmount exactly like a normal useGSAP callback.
 */
export function useLazyGSAP(
  setup: () => void | (() => void),
  {
    scope,
    rootMargin = "100% 0px",
    dependencies = [],
  }: { scope: RefObject<Element | null>; rootMargin?: string; dependencies?: unknown[] },
) {
  useGSAP(
    (_ctx, contextSafe) => {
      const el = scope.current;
      if (!el) return;
      let cleanup: void | (() => void);
      const run = contextSafe!(() => {
        cleanup = setup();
      });
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          io.disconnect();
          run();
        },
        { rootMargin },
      );
      io.observe(el);
      return () => {
        io.disconnect();
        if (typeof cleanup === "function") cleanup();
      };
    },
    { scope, dependencies },
  );
}
