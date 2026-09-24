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

export { gsap, ScrollTrigger, SplitText, useGSAP };
