"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { skills, type ProjectId, type Skill } from "@/content/content";
import { gsap, PLAY_ONCE } from "@/lib/gsap";
import { useLazyGSAP } from "@/lib/hooks/useLazyGSAP";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

type Focus = { kind: "skill"; name: string } | { kind: "project"; id: ProjectId } | null;
type Edge = { skill: string; project: ProjectId; d: string };

const allSkills = skills.groups.flatMap<Skill>((g) => g.items);
const skillByName = new Map(allSkills.map((s) => [s.name, s]));
const LEFT = skills.groups.slice(0, 3);
const RIGHT = skills.groups.slice(3);

/**
 * The stack as a live system (desktop): skill clusters on both flanks, the
 * products they power in the middle, and a wire for every real connection.
 * Hovering or focusing a skill lights its wires with travelling packets and
 * shows where it's used; hovering a product lights everything it runs on.
 * Wires are measured from the DOM so layout stays pure CSS.
 */
export default function SystemMap() {
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [focus, setFocus] = useState<Focus>(null);

  /* ── Measure wires from pill ports to project ports ────────────────── */
  const measure = useCallback(() => {
    const el = root.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const next: Edge[] = [];
    el.querySelectorAll<HTMLElement>("[data-skill]").forEach((pill) => {
      const skill = skillByName.get(pill.dataset.skill!);
      const side = pill.dataset.side;
      if (!skill?.usedIn) return;
      const p = pill.getBoundingClientRect();
      const x1 = (side === "left" ? p.right : p.left) - box.left;
      const y1 = p.top + p.height / 2 - box.top;
      for (const id of skill.usedIn) {
        const node = el.querySelector<HTMLElement>(`[data-project="${id}"]`);
        if (!node) continue;
        const n = node.getBoundingClientRect();
        const x2 = (side === "left" ? n.left : n.right) - box.left;
        const y2 = n.top + n.height / 2 - box.top;
        const mx = (x1 + x2) / 2;
        next.push({ skill: skill.name, project: id, d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}` });
      }
    });
    setEdges(next);
    setSize({ w: box.width, h: box.height });
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [measure]);

  /* ── What's lit? ───────────────────────────────────────────────────── */
  const lit = useMemo(() => {
    const skillsLit = new Set<string>();
    const projectsLit = new Set<ProjectId>();
    if (focus?.kind === "skill") {
      skillsLit.add(focus.name);
      skillByName.get(focus.name)?.usedIn?.forEach((p) => projectsLit.add(p));
    } else if (focus?.kind === "project") {
      projectsLit.add(focus.id);
      allSkills.forEach((s) => s.usedIn?.includes(focus.id) && skillsLit.add(s.name));
    }
    return { skillsLit, projectsLit };
  }, [focus]);

  const edgeLit = (e: Edge) =>
    focus?.kind === "skill" ? e.skill === focus.name : focus?.kind === "project" ? e.project === focus.id : false;

  /* ── Entrance: clusters come online, then the wires draw ───────────── */
  useLazyGSAP(
    () => {
      if (reduced) return;
      gsap.from("[data-cluster], [data-project-wrap]", {
        autoAlpha: 0,
        y: 24,
        duration: 0.9,
        stagger: 0.06,
        scrollTrigger: { trigger: root.current, start: "top 75%", ...PLAY_ONCE },
        // Wires are measured with getBoundingClientRect (transform-aware):
        // re-measure once everything has settled into place.
        onComplete: measure,
      });
    },
    { scope: root, dependencies: [reduced, measure] },
  );

  const detail =
    focus?.kind === "skill"
      ? { title: focus.name, body: skillByName.get(focus.name)?.where ?? "" }
      : focus?.kind === "project"
        ? {
            title: skills.projects.find((p) => p.id === focus.id)!.label,
            body: `Runs on ${allSkills
              .filter((s) => s.usedIn?.includes(focus.id))
              .map((s) => s.name)
              .join(", ")}.`,
          }
        : null;

  const cluster = (groups: typeof LEFT, side: "left" | "right") => (
    <div className={`flex flex-col justify-between gap-6 ${side === "left" ? "items-end text-right" : "items-start"}`}>
      {groups.map((g) => (
        <div key={g.id} data-cluster className={`flex flex-col gap-2 ${side === "left" ? "items-end" : "items-start"}`}>
          <p className="text-mono-label mb-1 flex items-center gap-2 text-lo">
            {side === "right" ? <span className="size-1.5 rounded-full bg-signal" aria-hidden="true" /> : null}
            {g.label}
            {side === "left" ? <span className="size-1.5 rounded-full bg-signal" aria-hidden="true" /> : null}
          </p>
          <ul className={`flex flex-col gap-2 ${side === "left" ? "items-end" : "items-start"}`}>
            {g.items.map((s) => {
              const on = lit.skillsLit.has(s.name);
              const dim = focus !== null && !on;
              return (
                <li key={s.name}>
                  <button
                    type="button"
                    data-skill={s.name}
                    data-side={side}
                    aria-describedby="map-detail"
                    onPointerEnter={() => setFocus({ kind: "skill", name: s.name })}
                    onPointerLeave={() => setFocus(null)}
                    onFocus={() => setFocus({ kind: "skill", name: s.name })}
                    onBlur={() => setFocus(null)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition-[color,border-color,background-color,opacity] duration-(--dur-fast) ${
                      on ? "border-ember bg-ember/10 text-hi" : "border-line bg-surface text-md hover:border-signal/60"
                    } ${dim ? "opacity-40" : ""}`}
                  >
                    {s.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <div ref={root} className="relative grid grid-cols-[1fr_minmax(14rem,18rem)_1fr] gap-x-16 xl:gap-x-24">
      {/* Wires */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-visible"
        width={size.w}
        height={size.h}
      >
        {edges.map((e) => {
          const on = edgeLit(e);
          return (
            <g key={`${e.skill}-${e.project}`}>
              <path
                d={e.d}
                fill="none"
                stroke={on ? "var(--color-ember)" : "var(--color-line)"}
                strokeWidth={on ? 1.5 : 1}
                className="transition-[stroke,opacity] duration-(--dur-base)"
                style={{ opacity: focus && !on ? 0.25 : on ? 0.9 : 0.7 }}
              />
              {/* Packets flow skill → product while a wire is lit */}
              {on && !reduced ? (
                <circle r={3} className="fill-ember-soft">
                  <animateMotion
                    dur="1.1s"
                    repeatCount="indefinite"
                    path={e.d}
                    keySplines="0.65 0 0.35 1"
                    keyTimes="0;1"
                    calcMode="spline"
                  />
                </circle>
              ) : null}
            </g>
          );
        })}
      </svg>

      {cluster(LEFT, "left")}

      {/* Products */}
      <div className="flex flex-col justify-center gap-5">
        {skills.projects.map((p) => {
          const on = lit.projectsLit.has(p.id);
          return (
            <div key={p.id} data-project-wrap>
              <button
                type="button"
                data-project={p.id}
                aria-describedby="map-detail"
                onPointerEnter={() => setFocus({ kind: "project", id: p.id })}
                onPointerLeave={() => setFocus(null)}
                onFocus={() => setFocus({ kind: "project", id: p.id })}
                onBlur={() => setFocus(null)}
                className={`surface relative w-full rounded-[14px] px-5 py-4 text-left transition-[border-color,box-shadow,opacity] duration-(--dur-base) ${
                  on ? "border-ember! shadow-[0_0_40px_-8px_var(--color-ember)]" : ""
                } ${focus && !on ? "opacity-50" : ""}`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-display text-lg font-semibold text-hi">{p.label}</span>
                  <span
                    className={`size-2 rounded-full transition-colors ${on ? "bg-ember" : "bg-line"}`}
                    aria-hidden="true"
                  />
                </span>
                <span className="text-mono-label mt-1 block text-lo">{p.sub}</span>
              </button>
            </div>
          );
        })}

        {/* Detail readout */}
        <div id="map-detail" className="min-h-[7.5rem]" aria-live="polite">
          {detail ? (
            <div key={detail.title} className="anim-swap-in pt-3">
              <p className="text-mono-label text-ember">{detail.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-md">{detail.body}</p>
            </div>
          ) : (
            <p key="hint" className="anim-swap-in text-mono-label pt-3 text-center text-lo">
              hover a node to trace it
            </p>
          )}
        </div>
      </div>

      {cluster(RIGHT, "right")}
    </div>
  );
}
