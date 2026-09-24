"use client";

/**
 * Single place where GSAP plugins are registered. Import gsap and friends
 * from here (never from "gsap" directly) so registration always happens once.
 */
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { EASE_BEZIER } from "./motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP);
  // Mirror the CSS motion tokens so GSAP and CSS animations feel identical.
  for (const [name, [a, b, c, d]] of Object.entries(EASE_BEZIER)) {
    CustomEase.create(name, `M0,0 C${a},${b} ${c},${d} 1,1`);
  }
  gsap.defaults({ ease: "signal", duration: 0.8 });
}

/**
 * "Play the first time it's reached, then stay put." Use this instead of
 * `once: true`: a once-trigger kills itself when it fires, and if that
 * happens inside another trigger's refresh (e.g. sections set up lazily
 * after a jump to an anchor further down), ScrollTrigger's internal list
 * shrinks mid-iteration and throws. Never-reversing toggleActions look
 * identical and never self-destruct.
 */
export const PLAY_ONCE = { toggleActions: "play none none none" } as const;

export { gsap, ScrollTrigger, SplitText, useGSAP };
