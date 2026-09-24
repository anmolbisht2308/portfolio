"use client";

import { useRef } from "react";
import { hero } from "@/content/content";
import { gsap, useGSAP } from "@/lib/gsap";
import Headline from "@/components/ui/Headline";
import Magnetic from "@/components/ui/Magnetic";
import { sceneState } from "@/components/three/scene-store";
import LiveClock from "./LiveClock";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Scroll → camera dolly-in (read by the WebGL scene every frame).
      gsap.to(sceneState, {
        dolly: 1,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });

      // Copy drifts up and dissolves as the camera moves into the network.
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to("[data-hero-copy]", {
          yPercent: -18,
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "85% top", scrub: true },
        });
      });
      return () => {
        mm.revert();
        sceneState.dolly = 0;
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="top"
      data-scene="hero"
      aria-labelledby="hero-title"
      className="relative z-10 flex min-h-svh flex-col justify-end pt-(--nav-h) pb-10 sm:pb-14"
    >
      <div data-hero-copy className="container-x">
        <p className="fade-up text-mono-label mb-6 flex items-center gap-3 text-md sm:mb-8" style={d(0)}>
          <span className="inline-block h-px w-8 bg-ember" aria-hidden="true" />
          {hero.eyebrow}
        </p>

        <Headline id="hero-title" segments={hero.headline} className="text-display-xl max-w-[14ch] text-hi" />

        <div className="mt-8 grid gap-8 sm:mt-12 lg:grid-cols-12 lg:items-end">
          <p className="fade-up text-lead max-w-[38ch] text-md lg:col-span-5" style={d(450)}>
            {hero.lead}
          </p>

          <div className="flex flex-wrap items-center gap-4 lg:col-span-4 lg:col-start-6">
            <Magnetic>
              <a
                href="#healo"
                className="fade-up group inline-flex items-center gap-3 rounded-full bg-hi px-6 py-3.5 font-medium text-void transition-colors duration-(--dur-fast) hover:bg-ember"
                style={d(600)}
              >
                See Healo
                <span aria-hidden="true" className="transition-transform duration-(--dur-base) ease-(--ease-signal) group-hover:translate-y-0.5">↓</span>
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href="#contact"
                className="fade-up inline-flex items-center rounded-full border border-line px-6 py-3.5 text-hi transition-colors duration-(--dur-fast) hover:border-ember-soft"
                style={d(680)}
              >
                Get in touch
              </a>
            </Magnetic>
          </div>

          {/* Live readout: the numbers that matter, rendered like telemetry */}
          <dl
            className="fade-up text-mono-data surface grid w-fit grid-cols-[auto_auto] gap-x-5 gap-y-1.5 rounded-[10px] px-4 py-3 text-lo lg:col-span-3 lg:justify-self-end"
            style={d(780)}
            aria-label="Live readout"
          >
            {hero.readout.map((r) => (
              <div key={r.key} className="contents">
                <dt>{r.key}:</dt>
                <dd className="text-right text-hi">{r.value}</dd>
              </div>
            ))}
            <div className="contents">
              <dt className="flex items-center gap-2">
                <span className="live-dot size-1.5!" aria-hidden="true" /> ts:
              </dt>
              <dd className="text-right text-md">
                <LiveClock />
              </dd>
            </div>
          </dl>
        </div>

        <div className="fade-up mt-12 hidden items-center gap-4 sm:flex" style={d(900)} aria-hidden="true">
          <div className="cue-wire" />
          <span className="text-mono-label text-lo">{hero.scrollCue}</span>
        </div>
      </div>
    </section>
  );
}
