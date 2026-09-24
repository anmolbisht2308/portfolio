"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import { site } from "@/content/content";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { hasWebGL } from "@/lib/webgl";
import type { PortraitState } from "./PortraitCanvas";

const PortraitCanvas = dynamic(() => import("./PortraitCanvas"), { ssr: false });

/**
 * "Real-time, human", literally: the portrait is a 3D point cloud built from
 * the photo + a depth map, and it assembles out of in-flight packets as the
 * About section scrolls in (progress is written by About's timeline).
 * Until WebGL is ready, and wherever it isn't available, a toned-down
 * photo holds the space so there's never an empty frame.
 */
export default function Portrait({ stateRef }: { stateRef: RefObject<PortraitState> }) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // Load WebGL only after the visitor first interacts (scroll/touch/key),
    // then as the portrait approaches. On phones it sits just below the
    // fold, so a look-ahead alone would load three.js during page load.
    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && hasWebGL()) {
          setMount(true);
          near.disconnect();
        }
      },
      { rootMargin: "50% 0px" },
    );
    const wake = ["scroll", "wheel", "touchstart", "pointermove", "keydown"] as const;
    const arm = () => {
      wake.forEach((ev) => window.removeEventListener(ev, arm));
      near.observe(el);
    };
    wake.forEach((ev) => window.addEventListener(ev, arm, { once: true, passive: true }));
    const onScreen = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    onScreen.observe(el);
    return () => {
      wake.forEach((ev) => window.removeEventListener(ev, arm));
      near.disconnect();
      onScreen.disconnect();
    };
  }, []);

  return (
    <figure className="relative mx-auto w-full max-w-[min(26rem,78vw)] lg:max-w-[min(34rem,calc(100svh-12rem))]">
      <div
        ref={box}
        className="relative aspect-square"
        onPointerEnter={() => (stateRef.current.hover = true)}
        onPointerLeave={() => (stateRef.current.hover = false)}
      >
        {/* Orbit rings: the portrait sits inside the network, as a node. */}
        <div aria-hidden="true" className="absolute inset-[6%] rounded-full border border-line/70" />
        <div aria-hidden="true" className="absolute inset-[14%] rounded-full border border-dashed border-line/50" />

        <Image
          src="/anmol.webp"
          alt={`Portrait of ${site.name}`}
          fill
          sizes="(min-width: 1024px) 34rem, 78vw"
          className={`rounded-full object-cover grayscale transition-opacity duration-[1200ms] ease-(--ease-signal) [mask-image:radial-gradient(circle,#000_55%,transparent_71%)] ${
            ready ? "opacity-0" : "opacity-50"
          }`}
        />
        {mount ? (
          <div
            aria-hidden="true"
            className={`absolute inset-0 transition-opacity duration-[1200ms] ease-(--ease-signal) ${ready ? "opacity-100" : "opacity-0"}`}
          >
            <PortraitCanvas stateRef={stateRef} running={visible} still={reduced} onReady={() => setReady(true)} />
          </div>
        ) : null}
      </div>
      <figcaption className="text-mono-label mt-2 flex items-center justify-center gap-2 text-lo">
        <span className="live-dot size-1.5!" aria-hidden="true" />
        {site.name.toLowerCase().replace(" ", ".")} · rendered live
        <span className="hidden lg:inline">· move your cursor</span>
      </figcaption>
    </figure>
  );
}
