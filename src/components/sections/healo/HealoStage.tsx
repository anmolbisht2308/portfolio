"use client";

import { useRef, useState } from "react";
import { healo, type ArchNodeId } from "@/content/content";
import { gsap, PLAY_ONCE, ScrollTrigger, useGSAP } from "@/lib/gsap";
import ArchitectureDiagram from "./ArchitectureDiagram";
import ChatStream from "./ChatStream";

const STEPS = healo.steps;

/**
 * Healo's scroll-driven stage: chat demo, live architecture diagram and the
 * five chapters.
 *
 * Desktop (≥1024 wide, ≥640 tall, motion OK): the stage pins for ~5 viewports.
 * Scroll progress walks through the chapters; the active chapter lights its
 * nodes in the diagram and a packet tours the architecture.
 *
 * Mobile / short screens / reduced motion: nothing pins. Chapters become a
 * swipeable carousel (mobile) or a list that activates as it crosses the
 * middle of the viewport, driving the same diagram.
 *
 * Kept as its own component (rendered before Collaborations/ImpactStats) so
 * the pin is created before any trigger further down the page: sibling
 * effects run in order, so later triggers measure with the pin spacing in place.
 * Pins are set up eagerly (unlike useLazyGSAP sections): a pin inserts scroll
 * distance, and adding it mid-scroll would shift anchor-link targets.
 */
export default function HealoStage() {
  const stage = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const progress = useRef(0);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const setStep = (i: number) => {
        setActive(i);
      };

      mm.add(
        {
          lg: "(min-width: 1024px)",
          tall: "(min-height: 640px)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const { lg, tall, reduce } = ctx.conditions as Record<string, boolean>;
          const items = gsap.utils.toArray<HTMLElement>("[data-step]", list.current);

          if (lg && tall && !reduce) {
            // Pinned, scroll-scrubbed walkthrough.
            ScrollTrigger.create({
              trigger: stage.current,
              start: "top top",
              end: `+=${STEPS.length * 70}%`,
              pin: true,
              anticipatePin: 1,
              refreshPriority: 1,
              onUpdate: (self) => {
                progress.current = self.progress;
                setStep(Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length)));
              },
            });
            // Stage elements arrive like connections coming online.
            gsap.from("[data-stage-in]", {
              y: 40,
              autoAlpha: 0,
              duration: 1.1,
              stagger: 0.12,
              scrollTrigger: { trigger: stage.current, start: "top 75%", ...PLAY_ONCE },
            });
            return;
          }

          if (lg) {
            // Desktop without pinning: activate chapters as they cross mid-screen.
            items.forEach((el, i) =>
              ScrollTrigger.create({
                trigger: el,
                start: "top 55%",
                end: "bottom 55%",
                onToggle: (self) => {
                  if (self.isActive) {
                    setStep(i);
                    progress.current = i / (STEPS.length - 1);
                  }
                },
              }),
            );
            return;
          }

          // Mobile: the chapter carousel. The snapped card is the active step.
          const io = new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                const i = items.indexOf(entry.target as HTMLElement);
                setStep(i);
                progress.current = i / (STEPS.length - 1);
              }
            },
            { root: list.current, threshold: 0.6 },
          );
          items.forEach((el) => io.observe(el));
          return () => io.disconnect();
        },
      );
    },
    { scope: stage },
  );

  const activeNodes: ArchNodeId[] = STEPS[active].nodes;

  return (
    <div ref={stage} className="lg:flex lg:min-h-svh lg:items-center lg:pt-(--nav-h)">
      <div className="container-x grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-8">
        <div data-stage-in className="min-w-0 lg:col-span-5">
          <ChatStream />
        </div>

        <div data-stage-in className="min-w-0 lg:col-span-4">
          <ArchitectureDiagram activeNodes={activeNodes} progress={progress} />
        </div>

        <div data-stage-in className="min-w-0 lg:col-span-3">
          <p className="text-mono-label mb-4 flex items-center justify-between text-lo lg:mb-6">
            <span>How it works</span>
            <span className="text-mono-data text-md" aria-hidden="true">
              {String(active + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
            </span>
          </p>
          <ol
            ref={list}
            className="-mx-(--gutter) flex snap-x snap-mandatory gap-3 overflow-x-auto px-(--gutter) pb-2 [scrollbar-width:none] lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0"
          >
            {STEPS.map((step, i) => {
              const on = i === active;
              return (
                <li
                  key={step.kicker}
                  data-step
                  aria-current={on ? "step" : undefined}
                  className={`surface relative min-w-[82%] snap-center rounded-[10px] p-5 transition-[opacity,border-color] duration-(--dur-base) sm:min-w-[60%] lg:min-w-0 lg:border-transparent lg:bg-transparent lg:bg-none lg:p-0 lg:py-3 lg:pl-5 lg:shadow-none ${
                    on ? "opacity-100" : "opacity-60 lg:opacity-45"
                  }`}
                >
                  {/* Desktop progress rail */}
                  <span
                    aria-hidden="true"
                    className={`absolute top-3 bottom-3 left-0 hidden w-px origin-top transition-[transform,background-color] duration-(--dur-slow) ease-(--ease-signal) lg:block ${
                      on ? "scale-y-100 bg-ember" : "scale-y-50 bg-line"
                    }`}
                  />
                  <p className={`text-mono-label ${on ? "text-ember" : "text-lo"}`}>{step.kicker}</p>
                  <h3 className="mt-1.5 font-display text-lg leading-snug font-semibold text-hi">{step.title}</h3>
                  <div
                    className={`grid transition-[grid-template-rows] duration-(--dur-base) ease-(--ease-signal) lg:grid-rows-[0fr] ${
                      on ? "lg:grid-rows-[1fr]" : ""
                    }`}
                  >
                    <ul className="min-h-0 overflow-hidden">
                      {step.points.map((pt) => (
                        <li key={pt} className="mt-2.5 flex gap-2.5 text-sm leading-relaxed text-md">
                          <span aria-hidden="true" className="mt-[0.6em] size-1 shrink-0 rounded-full bg-signal" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="text-mono-label mt-3 text-lo lg:hidden" aria-hidden="true">
            swipe for chapters →
          </p>
        </div>
      </div>
    </div>
  );
}
