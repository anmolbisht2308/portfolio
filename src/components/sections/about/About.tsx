"use client";

import { useRef } from "react";
import { about } from "@/content/content";
import { gsap, PLAY_ONCE, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { sceneState } from "@/components/three/scene-store";

/**
 * About: a short, human intro. Each sentence "streams" from dim to lit as
 * you scroll, while the hero network behind settles into a calm ring.
 *
 * Desktop (motion OK): the section pins for ~1.5 viewports and a single
 * scrubbed timeline drives both the text and `sceneState.calm`.
 * Mobile: no pin; each line lights as it crosses the viewport and the
 * network calms across the section. Reduced motion: everything lit, static.
 */
export default function About() {
  const root = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const lines = gsap.utils.toArray<HTMLElement>("[data-line]");
      const mm = gsap.matchMedia();

      mm.add(
        {
          pin: "(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)",
          flow: "(max-width: 1023px), (max-height: 639px)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const { pin, reduce } = ctx.conditions as Record<string, boolean>;
          if (reduce) return;

          // Dim the lines just before the section scrolls into view (not at
          // load), so off-screen text is never low-contrast for audits/no-JS.
          let dimmed = false;
          ScrollTrigger.create({
            trigger: root.current,
            start: "top bottom",
            onEnter: () => {
              if (dimmed) return; // one-shot without `once` (see PLAY_ONCE)
              dimmed = true;
              gsap.set(lines, { opacity: 0.16 });
              gsap.set("[data-about-meta]", { opacity: 0, y: 16 });
            },
          });

          if (pin) {
            const tl = gsap.timeline({
              defaults: { ease: "none" },
              scrollTrigger: {
                trigger: inner.current,
                start: "top top",
                end: "+=150%",
                pin: true,
                scrub: 0.6,
                refreshPriority: 2,
              },
            });
            lines.forEach((line, i) => tl.to(line, { opacity: 1, duration: 1 }, i * 0.9));
            tl.to("[data-about-meta]", { opacity: 1, y: 0, duration: 1 }, lines.length * 0.9 - 0.5);
            // Network settles over the whole pin.
            tl.to(sceneState, { calm: 1, duration: tl.duration() }, 0);
            return () => {
              sceneState.calm = 0;
            };
          }

          // Unpinned flow: lines light individually; network calms across the section.
          lines.forEach((line) =>
            gsap.to(line, {
              opacity: 1,
              ease: "none",
              scrollTrigger: { trigger: line, start: "top 85%", end: "top 45%", scrub: true },
            }),
          );
          gsap.to("[data-about-meta]", {
            opacity: 1,
            y: 0,
            scrollTrigger: { trigger: "[data-about-meta]", start: "top 90%", ...PLAY_ONCE },
          });
          gsap.to(sceneState, {
            calm: 1,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "center center", scrub: true },
          });
          return () => {
            sceneState.calm = 0;
          };
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} id="about" data-scene="about" aria-labelledby="about-title" className="relative z-10">
      <div ref={inner} className="container-x flex min-h-svh flex-col justify-center py-24 lg:py-0">
        <p className="text-mono-label mb-8 flex items-center gap-3 text-lo">
          <span className="live-dot size-1.5!" aria-hidden="true" />
          <span id="about-title">{about.kicker}</span>
        </p>

        <div className="max-w-[26ch] space-y-3 font-display text-[clamp(1.75rem,1.1rem+2.6vw,3.5rem)] leading-[1.08] font-semibold tracking-[-0.03em] text-hi sm:max-w-[30ch] lg:max-w-[34ch]">
          {about.lines.map((line) => (
            <p key={line} data-line>
              {line}
            </p>
          ))}
        </div>

        <dl data-about-meta className="text-mono-data mt-14 grid max-w-3xl gap-x-10 gap-y-4 text-lo sm:grid-cols-3">
          <div>
            <dt className="text-mono-label">Location</dt>
            <dd className="mt-1 text-md">{about.location}</dd>
          </div>
          <div>
            <dt className="text-mono-label">Education</dt>
            <dd className="mt-1 text-md">{about.education.degree}</dd>
          </div>
          <div>
            <dt className="text-mono-label">{about.education.years}</dt>
            <dd className="mt-1 text-md">{about.education.school}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
