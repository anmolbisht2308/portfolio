/**
 * Calendar layout + colours shared by the 3D view and the flat fallback.
 * Deliberately free of three.js so importing it never pulls in WebGL code.
 */
import type { ContributionDay } from "@/lib/github";

/* Level ramp stays cool (deep indigo → signal core). The warm accent is
   reserved for the year's busiest day, so it stays rare and meaningful. */
export const LEVEL_HEX = ["#1b1f40", "#243377", "#3f59c7", "#7c9cff", "#c3d0ff"];
export const PEAK_HEX = "#ff9b6a";

export type Cell = ContributionDay & { week: number; weekday: number };

/** Lay a year out like GitHub: columns are weeks (Sun→Sat top to bottom). */
export function toCells(days: ContributionDay[]): Cell[] {
  if (!days.length) return [];
  const year = Number(days[0].date.slice(0, 4));
  const offset = new Date(Date.UTC(year, 0, 1)).getUTCDay();
  return days.map((d) => {
    const t = Date.UTC(year, Number(d.date.slice(5, 7)) - 1, Number(d.date.slice(8, 10)));
    const doy = Math.round((t - Date.UTC(year, 0, 1)) / 86400000);
    return { ...d, week: Math.floor((doy + offset) / 7), weekday: (doy + offset) % 7 };
  });
}
