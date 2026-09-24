"use client";

import { useState } from "react";
import { skills } from "@/content/content";

const projectLabel = Object.fromEntries(skills.projects.map((p) => [p.id, p.label]));

/**
 * Mobile / tablet version of the system map: grouped chips. Tapping a chip
 * opens its connection inline (where it's used) instead of drawing wires.
 */
export default function SkillList() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {skills.groups.map((g) => {
        const active = g.items.find((s) => s.name === open);
        return (
          <div key={g.id} className="surface rounded-[10px] p-5">
            <p className="text-mono-label flex items-center gap-2 text-lo">
              <span className="size-1.5 rounded-full bg-signal" aria-hidden="true" />
              {g.label}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {g.items.map((s) => {
                const on = s.name === open;
                return (
                  <li key={s.name}>
                    <button
                      type="button"
                      aria-expanded={on}
                      onClick={() => setOpen(on ? null : s.name)}
                      className={`rounded-full border px-3.5 py-2 text-sm transition-colors duration-(--dur-fast) ${
                        on ? "border-ember bg-ember/10 text-hi" : "border-line bg-base/40 text-md"
                      }`}
                    >
                      {s.name}
                    </button>
                  </li>
                );
              })}
            </ul>
            {/* Expands with a grid-rows transition (height: auto without JS measuring) */}
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-(--dur-base) ease-(--ease-signal) ${
                active ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="min-h-0 overflow-hidden" aria-hidden={!active}>
                {active ? (
                  <div key={active.name} className="anim-swap-in mt-4 border-t border-line pt-4">
                    {active.usedIn?.length ? (
                      <p className="text-mono-label flex flex-wrap items-center gap-2 text-ember">
                        <span aria-hidden="true">→</span>
                        {active.usedIn.map((id) => projectLabel[id]).join(" · ")}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm leading-relaxed text-md">{active.where}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
