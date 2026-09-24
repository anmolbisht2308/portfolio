"use client";

import { useRef } from "react";
import { about, experience, experienceMeta, type Role } from "@/content/content";
import { gsap, PLAY_ONCE } from "@/lib/gsap";
import { useLazyGSAP } from "@/lib/hooks/useLazyGSAP";
import SectionHeader from "@/components/ui/SectionHeader";

/** Oldest first: the log reads like a trace, and the present arrives last. */
const earlier = experience.filter((r) => r.company !== "Infiheal").sort((a, b) => a.start.localeCompare(b.start));
const infiheal = experience.filter((r) => r.company === "Infiheal").sort((a, b) => a.start.localeCompare(b.start));

/** Inclusive month count for closed roles (open roles show "Present"). */
function months(r: Role & { end: string }) {
  const [sy, sm] = r.start.split("-").map(Number);
  const [ey, em] = r.end.split("-").map(Number);
  return Math.max(1, (ey - sy) * 12 + (em - sm) + 1);
}

/**
 * Experience as a live event log. A vertical wire carries a packet that
 * tracks your scroll; each entry "arrives" (port acks, line slides in) as it
 * enters. The three Infiheal roles form a promotion path: a single trace
 * that climbs through intern → SDE → lead.
 */
export default function Experience() {
  const root = useRef<HTMLElement>(null);

  useLazyGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Packet riding the wire, scrubbed to scroll.
        gsap.fromTo(
          "[data-wire-packet]",
          { top: "0%" },
          {
            top: "100%",
            ease: "none",
            scrollTrigger: { trigger: "[data-wire]", start: "top 70%", end: "bottom 60%", scrub: 0.4 },
          },
        );
        // Each entry arrives as a message.
        gsap.utils.toArray<HTMLElement>("[data-entry]").forEach((row) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 85%", ...PLAY_ONCE } });
          tl.from(row.querySelector("[data-port]"), { scale: 0, duration: 0.5, ease: "ack" })
            .from(row.querySelector("[data-body]"), { x: -24, autoAlpha: 0, duration: 0.8 }, "-=0.25")
            .from(row.querySelector("[data-ts]"), { autoAlpha: 0, duration: 0.4 }, "<");
        });
        // Promotion path: the trace climbs through each role.
        gsap.from("[data-promo-line]", {
          scaleY: 0,
          ease: "none",
          scrollTrigger: { trigger: "[data-promo]", start: "top 75%", end: "bottom 60%", scrub: 0.4 },
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="experience"
      aria-labelledby="experience-title"
      className="relative z-10 border-t border-line/60 bg-base py-(--section-y)"
    >
      <div className="container-x">
        <SectionHeader
          id="experience-title"
          index={experienceMeta.index}
          kicker={experienceMeta.kicker}
          title={experienceMeta.title}
          className="mb-14 lg:mb-20"
        />

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Log header (desktop): column labels like a trace viewer */}
          <div className="hidden lg:col-span-3 lg:block">
            <div className="text-mono-data sticky top-[calc(var(--nav-h)+2rem)] space-y-2 text-lo">
              <p className="text-mono-label text-md">trace · anmol.bisht</p>
              <p>
                events: <span className="text-hi">{experience.length + 1}</span>
              </p>
              <p>
                since: <span className="text-hi">2020</span>
              </p>
              <p className="flex items-center gap-2">
                status: <span className="live-dot size-1.5!" aria-hidden="true" />
                <span className="text-ember">streaming</span>
              </p>
            </div>
          </div>

          <div data-wire className="relative lg:col-span-9">
            {/* Wire + scroll packet */}
            <div aria-hidden="true" className="absolute top-2 bottom-2 left-[5px] w-px bg-line">
              <span
                data-wire-packet
                className="absolute left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal-core shadow-[0_0_12px_2px_var(--color-signal)]"
              />
            </div>

            <ol className="space-y-1">
              {/* Boot event: education */}
              <LogRow ts={about.education.years.slice(0, 4)} tag="BOOT" tagClass="text-lo">
                <p className="text-hi">{about.education.degree}</p>
                <p className="text-sm text-md">{about.education.school}</p>
              </LogRow>

              {earlier.map((r) => (
                <LogRow
                  key={r.company + r.start}
                  ts={r.start}
                  tag={r.end ? `${months({ ...r, end: r.end })}MO` : "ACTIVE"}
                  tagClass="text-lo"
                >
                  <p className="flex flex-wrap items-baseline gap-x-3">
                    <span className="text-hi">{r.role}</span>
                    <span className="text-md">
                      @{" "}
                      {r.href ? (
                        <a
                          href={r.href}
                          target="_blank"
                          rel="noreferrer"
                          className="underline decoration-line underline-offset-4 hover:text-ember hover:decoration-ember"
                        >
                          {r.company}
                        </a>
                      ) : (
                        r.company
                      )}
                    </span>
                  </p>
                  <p className="text-mono-data text-lo">
                    {r.display}
                    {r.remote ? " · remote" : ""}
                    {r.note ? ` · ${r.note}` : ""}
                  </p>
                </LogRow>
              ))}

              {/* Infiheal: the promotion path */}
              <li data-entry data-promo className="relative pt-6 pb-2 pl-8">
                <span
                  data-port
                  aria-hidden="true"
                  className="absolute top-8 left-0 size-[11px] rounded-full border-2 border-ember bg-base"
                />
                <div data-body className="surface rounded-[14px] p-5 sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-display text-2xl font-semibold text-hi">Infiheal</p>
                    <p className="text-mono-label rounded-full border border-ember/40 px-3 py-1 text-ember">
                      {experienceMeta.promotion}
                    </p>
                  </div>
                  <ol className="relative mt-6 space-y-6 pl-7">
                    <span aria-hidden="true" className="absolute top-2 bottom-2 left-[5px] w-px bg-line" />
                    <span
                      data-promo-line
                      aria-hidden="true"
                      className="absolute top-2 bottom-2 left-[5px] w-px origin-top bg-gradient-to-b from-signal to-ember"
                    />
                    {infiheal.map((r, i) => {
                      const current = r.end === null;
                      return (
                        <li key={r.start} className="relative">
                          <span
                            aria-hidden="true"
                            className={`absolute top-1.5 -left-7 size-[11px] rounded-full ${
                              current ? "bg-ember shadow-[0_0_14px_var(--color-ember)]" : "border border-signal bg-base"
                            }`}
                          />
                          <p className="text-mono-data text-lo" data-ts>
                            {r.start} ·{" "}
                            {current ? <span className="text-ember">ACTIVE</span> : i === 0 ? "JOINED" : "PROMOTED"}
                          </p>
                          <p
                            className={`mt-1 font-display font-semibold ${current ? "text-2xl text-hi sm:text-3xl" : "text-lg text-hi"}`}
                          >
                            {r.role}
                          </p>
                          <p className="text-mono-data mt-0.5 text-lo">
                            {r.display}
                            {r.end ? ` · ${months({ ...r, end: r.end })} mo` : ""}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function LogRow({
  ts,
  tag,
  tagClass,
  children,
}: {
  ts: string;
  tag: string;
  tagClass: string;
  children: React.ReactNode;
}) {
  return (
    <li
      data-entry
      className="relative grid grid-cols-[1fr] gap-1 py-4 pl-8 sm:grid-cols-[6.5rem_1fr_auto] sm:items-baseline sm:gap-6"
    >
      <span
        data-port
        aria-hidden="true"
        className="absolute top-[1.4rem] left-0 size-[11px] rounded-full border border-signal bg-base"
      />
      <span data-ts className="text-mono-data text-lo">
        [{ts}]
      </span>
      <div data-body>{children}</div>
      <span className={`text-mono-label hidden sm:block ${tagClass}`}>{tag}</span>
    </li>
  );
}
