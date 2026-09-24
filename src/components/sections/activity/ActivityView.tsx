"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Contributions } from "@/lib/github";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { LEVEL_HEX, PEAK_HEX, toCells, type Cell } from "./calendar";
import FlatHeatmap from "./FlatHeatmap";
import { hasWebGL } from "@/lib/webgl";

const ContributionsCanvas = dynamic(() => import("./ContributionsCanvas"), { ssr: false });

const nf = new Intl.NumberFormat("en-IN");
const df = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fmtDate = (iso: string) => df.format(new Date(`${iso}T00:00:00Z`));

/**
 * The GitHub contribution calendar as a 3D city of days. Year tabs swap the
 * data (bars morph in a wave), hover/tap reads out a single day. The WebGL
 * chunk loads only when the section approaches the viewport; a flat SVG
 * heatmap stands in until then (and if WebGL is unavailable).
 */
export default function ActivityView({ data }: { data: Contributions }) {
  const reduced = useReducedMotion();
  const years = data.years;
  const [index, setIndex] = useState(years.length - 1);
  const [playKey, setPlayKey] = useState(0);
  const [mount, setMount] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tip, setTip] = useState<{ cell: Cell; x: number; y: number } | null>(null);
  const stage = useRef<HTMLDivElement>(null);

  const year = years[index];
  const cells = useMemo(() => toCells(year.days), [year]);

  // Load WebGL when near; render only while on screen.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && hasWebGL()) {
          setMount(true);
          near.disconnect();
        }
      },
      { rootMargin: "60% 0px" },
    );
    const onScreen = new IntersectionObserver(([e]) => {
      setVisible(e.isIntersecting);
      // Replay the rise each time the graph scrolls back into view.
      if (e.isIntersecting) setPlayKey((k) => k + 1);
    });
    near.observe(el);
    onScreen.observe(el);
    return () => {
      near.disconnect();
      onScreen.disconnect();
    };
  }, []);

  const s = year.stats;
  const stats = [
    { label: "contributions", value: nf.format(s.total) },
    { label: "active days", value: nf.format(s.activeDays) },
    { label: "longest streak", value: `${s.longestStreak}d` },
    {
      label: "busiest day",
      value: s.busiest ? `${s.busiest.count}` : "—",
      note: s.busiest ? fmtDate(s.busiest.date) : undefined,
    },
  ];

  const onTab = (i: number) => {
    setIndex(i);
    setTip(null);
  };

  return (
    <div className="surface overflow-hidden rounded-[20px]">
      {/* Controls */}
      <div className="flex flex-col gap-5 border-b border-line p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label="Contribution year"
          className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]"
          onKeyDown={(e) => {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            const next = (index + (e.key === "ArrowRight" ? 1 : -1) + years.length) % years.length;
            onTab(next);
            (e.currentTarget.children[next] as HTMLElement | undefined)?.focus();
          }}
        >
          {years.map((y, i) => (
            <button
              key={y.year}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-controls="activity-panel"
              tabIndex={i === index ? 0 : -1}
              onClick={() => onTab(i)}
              className={`text-mono-data shrink-0 rounded-full px-4 py-2 transition-colors duration-(--dur-fast) ${
                i === index ? "bg-hi text-void" : "text-md hover:bg-raised hover:text-hi"
              }`}
            >
              {y.year}
            </button>
          ))}
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
          {stats.map((st) => (
            <div key={st.label}>
              <dt className="text-mono-label text-lo">{st.label}</dt>
              <dd key={`${year.year}-${st.value}`} className="anim-swap-in font-display text-xl font-semibold text-hi">
                {st.value}
                {st.note ? <span className="text-mono-data ml-2 font-normal text-lo">{st.note}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* 3D stage */}
      <div
        id="activity-panel"
        role="tabpanel"
        aria-label={`${year.year}: ${nf.format(s.total)} contributions`}
        ref={stage}
        className="relative h-[min(150vw,40rem)] sm:h-[clamp(18rem,36vw,32rem)]"
        onPointerLeave={() => setTip(null)}
      >
        <div className="absolute inset-0 grid place-items-center p-6" aria-hidden="true">
          {!mount ? <FlatHeatmap cells={cells} /> : null}
        </div>
        {mount ? (
          <div className="absolute inset-0" aria-hidden="true">
            <ContributionsCanvas
              cells={cells}
              playKey={playKey}
              running={visible}
              still={reduced}
              onHover={(cell, x, y) => setTip(cell ? { cell, x, y } : null)}
            />
          </div>
        ) : null}

        {tip ? (
          <div
            role="status"
            className="text-mono-data pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-lg border border-line bg-base/90 px-3 py-2 whitespace-nowrap text-md shadow-xl backdrop-blur"
            style={{ left: tip.x, top: tip.y }}
          >
            <span className="text-hi">
              {tip.cell.count} contribution{tip.cell.count === 1 ? "" : "s"}
            </span>{" "}
            · {fmtDate(tip.cell.date)}
          </div>
        ) : null}

        <p className="sr-only">
          In {year.year}, {nf.format(s.total)} contributions across {s.activeDays} active days. Longest streak:{" "}
          {s.longestStreak} days.
          {s.busiest ? ` Busiest day: ${fmtDate(s.busiest.date)} with ${s.busiest.count} contributions.` : ""}
        </p>
      </div>

      {/* Legend + source */}
      <div className="text-mono-label flex flex-col gap-3 border-t border-line px-5 py-4 text-lo sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2">
          less
          {LEVEL_HEX.map((c) => (
            <span key={c} className="size-3 rounded-[3px]" style={{ background: c }} aria-hidden="true" />
          ))}
          more
          <span className="ml-3 size-3 rounded-[3px]" style={{ background: PEAK_HEX }} aria-hidden="true" />
          busiest day
        </p>
        <p>
          {data.source === "sample" ? (
            <span className="text-ember">sample data · GitHub unreachable at build time</span>
          ) : (
            <>
              <a
                href={`https://github.com/${data.username}`}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-line underline-offset-4 hover:text-ember hover:decoration-ember"
              >
                github.com/{data.username}
              </a>{" "}
              · updated {fmtDate(data.fetchedAt)}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
