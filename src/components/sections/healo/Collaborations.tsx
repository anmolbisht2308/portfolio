"use client";

import { useRef } from "react";
import { healo } from "@/content/content";
import { gsap } from "@/lib/gsap";
import { useLazyGSAP } from "@/lib/hooks/useLazyGSAP";
import SplitReveal from "@/components/ui/SplitReveal";

/**
 * "Built with, not just for": the people Healo needed. Each card opens a
 * connection: on hover a line draws from the card's port to the edge, the
 * same handshake motion used elsewhere on the site.
 */
export default function Collaborations() {
  const root = useRef<HTMLDivElement>(null);

  useLazyGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-collab]", {
          y: 48,
          autoAlpha: 0,
          duration: 1,
          stagger: 0.09,
          scrollTrigger: { trigger: root.current, start: "top 80%", once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="container-x pt-(--section-y)">
      <div className="mb-10 flex flex-col gap-4 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
        <SplitReveal as="h3" by="words" className="text-h2 max-w-[18ch] text-hi">
          Built <span className="human">with</span> people, not just for them.
        </SplitReveal>
        <p className="max-w-[40ch] text-md">
          Sensitive conversations need more than engineering. I worked across four very different teams to ship this.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {healo.collaborations.map((c) => (
          <li
            key={c.with}
            data-collab
            className="surface group relative overflow-hidden rounded-[10px] p-6 transition-colors duration-(--dur-base) hover:border-signal/50"
          >
            <p className="text-mono-label flex items-center gap-2 text-lo">
              <span
                className="size-1.5 rounded-full bg-signal transition-colors duration-(--dur-fast) group-hover:bg-ember"
                aria-hidden="true"
              />
              <span
                aria-hidden="true"
                className="h-px w-6 origin-left scale-x-50 bg-line transition-[transform,background-color] duration-(--dur-slow) ease-(--ease-signal) group-hover:scale-x-100 group-hover:bg-ember"
              />
              {c.with}
            </p>
            <h4 className="mt-8 font-display text-xl font-semibold text-hi">{c.title}</h4>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-md">{c.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
