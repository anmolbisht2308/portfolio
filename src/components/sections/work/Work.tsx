"use client";

import Image from "next/image";
import { useRef } from "react";
import { work, workMeta } from "@/content/content";
import { gsap, PLAY_ONCE } from "@/lib/gsap";
import { useLazyGSAP } from "@/lib/hooks/useLazyGSAP";
import SectionHeader from "@/components/ui/SectionHeader";
import TiltCard from "@/components/ui/TiltCard";

/** Placeholder "screen" until a real screenshot is added in content.ts. */
function PlaceholderArt({ seed }: { seed: number }) {
  const bars = [0.72, 0.48, 0.86, 0.6, 0.38].map((w, i) => ((w + seed * 0.13 * (i + 1)) % 0.6) + 0.3);
  return (
    <div aria-hidden="true" className="absolute inset-0 flex flex-col bg-gradient-to-br from-raised to-surface p-5">
      <div className="flex gap-1.5">
        <span className="size-2 rounded-full bg-line" />
        <span className="size-2 rounded-full bg-line" />
        <span className="size-2 rounded-full bg-line" />
      </div>
      <div className="mt-5 grid flex-1 grid-cols-[1fr_1.4fr] gap-4">
        <div className="space-y-2.5">
          {bars.map((w, i) => (
            <div key={i} className="h-2 rounded-full bg-line/80" style={{ width: `${w * 100}%` }} />
          ))}
        </div>
        <div className="relative overflow-hidden rounded-lg border border-line/70">
          <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 size-full">
            <polyline
              points={Array.from({ length: 9 }, (_, i) => `${i * 12.5},${30 + Math.sin(i * 1.3 + seed) * 18}`).join(
                " ",
              )}
              fill="none"
              stroke="var(--color-signal)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              opacity="0.7"
            />
          </svg>
        </div>
      </div>
      <p className="text-mono-label mt-4 text-lo">[ADD screenshot]</p>
    </div>
  );
}

export default function Work() {
  const root = useRef<HTMLElement>(null);

  useLazyGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-work]", {
          y: 60,
          autoAlpha: 0,
          duration: 1.1,
          stagger: 0.1,
          scrollTrigger: { trigger: "[data-work-grid]", start: "top 80%", ...PLAY_ONCE },
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="work"
      aria-labelledby="work-title"
      className="relative z-10 border-t border-line/60 bg-base py-(--section-y)"
    >
      <div className="container-x">
        <SectionHeader
          id="work-title"
          index={workMeta.index}
          kicker={workMeta.kicker}
          title={workMeta.title}
          className="mb-14 lg:mb-20"
        />

        <ul data-work-grid className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {work.map((w, i) => {
            const inner = (
              <article className="surface flex h-full flex-col overflow-hidden rounded-[14px] transition-colors duration-(--dur-base) group-hover:border-signal/40">
                <div className="relative aspect-[16/10] overflow-hidden border-b border-line">
                  {w.image ? (
                    <Image
                      src={w.image}
                      alt={`${w.title} screenshot`}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-[900ms] ease-(--ease-signal) group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="absolute inset-0 transition-transform duration-[900ms] ease-(--ease-signal) group-hover:scale-[1.04]">
                      <PlaceholderArt seed={i + 1} />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-6 sm:p-7">
                  <p className="text-mono-label text-lo">{w.kind}</p>
                  <h3 className="flex items-center justify-between gap-4 font-display text-2xl font-semibold text-hi">
                    {w.title}
                    {w.href ? (
                      <span
                        aria-hidden="true"
                        className="text-lo transition-[transform,color] duration-(--dur-base) ease-(--ease-signal) group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-ember"
                      >
                        ↗
                      </span>
                    ) : null}
                  </h3>
                  <p className="text-md">{w.body}</p>
                </div>
              </article>
            );
            return (
              <li key={w.title} data-work>
                <TiltCard className="h-full rounded-[14px]">
                  {w.href ? (
                    <a
                      href={w.href}
                      target="_blank"
                      rel="noreferrer"
                      className="block h-full rounded-[14px]"
                      data-cursor-label="visit"
                    >
                      {inner}
                    </a>
                  ) : (
                    inner
                  )}
                </TiltCard>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
