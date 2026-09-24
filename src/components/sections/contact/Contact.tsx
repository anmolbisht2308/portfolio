"use client";

import { useRef } from "react";
import { contact, site } from "@/content/content";
import { gsap } from "@/lib/gsap";
import { useLazyGSAP } from "@/lib/hooks/useLazyGSAP";
import { sceneState } from "@/components/three/scene-store";
import CopyEmail from "@/components/ui/CopyEmail";
import Magnetic from "@/components/ui/Magnetic";

/**
 * Closing moment. As the section scrolls in, every node of the network
 * converges on the centre of the screen into one breathing node, and that
 * node *becomes* the CTA (the DOM button sits exactly over it).
 * The stage is CSS-sticky; one scrubbed timeline drives scene + UI.
 */
export default function Contact() {
  const root = useRef<HTMLElement>(null);

  useLazyGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom bottom",
            scrub: 0.5,
          },
        });
        tl.to(sceneState, { converge: 1, duration: 0.55 }, 0)
          .from("[data-c-head]", { autoAlpha: 0, y: 30, duration: 0.25, ease: "signal" }, 0.3)
          .from("[data-c-node]", { scale: 0, autoAlpha: 0, duration: 0.22, ease: "ack" }, 0.5)
          .from(
            "[data-c-links] > *",
            {
              autoAlpha: 0,
              y: 16,
              stagger: 0.04,
              duration: 0.2,
              ease: "signal",
            },
            0.62,
          )
          .to({}, { duration: 0.15 }); // hold at the end
        return () => {
          sceneState.converge = 0;
        };
      });
    },
    { scope: root },
  );

  const links = [
    { label: "LinkedIn", href: site.linkedin, external: true },
    ...(site.github ? [{ label: "GitHub", href: site.github, external: true }] : []),
    { label: "Résumé ↓", href: site.resume, external: false },
  ];

  return (
    <section
      ref={root}
      id="contact"
      data-scene="contact"
      aria-labelledby="contact-title"
      className="relative z-10 h-[190svh] motion-reduce:h-auto"
    >
      <div className="sticky top-0 grid h-svh grid-rows-[1fr_auto_1fr] items-center motion-reduce:static motion-reduce:h-auto motion-reduce:gap-12 motion-reduce:py-(--section-y)">
        <div data-c-head className="container-x self-end pb-10 text-center">
          <p className="text-mono-label mb-5 flex items-center justify-center gap-3 text-lo">
            <span className="text-ember">{contact.index}</span>
            <span className="h-px w-8 bg-line" aria-hidden="true" />
            {contact.kicker}
          </p>
          <h2 id="contact-title" className="text-h2 mx-auto max-w-[16ch] text-hi">
            {contact.headline.map((s, i) => (
              <span key={i} className={s.em ? "human" : undefined}>
                {s.text}{" "}
              </span>
            ))}
          </h2>
        </div>

        {/* The converged node → CTA. Centred exactly on the viewport. */}
        <div className="flex justify-center">
          {/* GSAP animates this wrapper; the link keeps its own CSS transitions. */}
          <div data-c-node>
            <Magnetic strength={0.25}>
              <a
                href={`mailto:${site.email}`}
                data-cursor-label="open"
                className="group relative grid size-32 place-items-center rounded-full bg-ember text-center font-display text-lg font-semibold text-void shadow-[0_0_60px_-4px_var(--color-ember)] transition-[background-color,transform] duration-(--dur-base) ease-(--ease-ack) hover:scale-105 hover:bg-ember-soft sm:size-40 sm:text-xl"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full border border-ember/60 motion-safe:animate-[cta-ring_2.4s_var(--ease-signal)_infinite]"
                />
                <span className="relative leading-tight">
                  {contact.cta}
                  <span
                    aria-hidden="true"
                    className="mt-1 block text-base transition-transform duration-(--dur-base) group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </a>
            </Magnetic>
          </div>
        </div>

        <div className="container-x self-start pt-10">
          <p className="mx-auto mb-8 max-w-[46ch] text-center text-md">{contact.body}</p>
          <div data-c-links className="flex flex-wrap items-center justify-center gap-3">
            <CopyEmail email={site.email} />
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                {...(l.external ? { target: "_blank", rel: "noreferrer" } : { download: true })}
                className="text-mono-label rounded-full border border-line bg-base/60 px-5 py-3.5 text-md backdrop-blur transition-colors duration-(--dur-fast) hover:border-ember-soft hover:text-hi"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
