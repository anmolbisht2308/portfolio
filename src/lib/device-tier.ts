/**
 * Adaptive quality. We pick an initial tier from cheap hardware hints, then
 * drei's <PerformanceMonitor> can step it down at runtime if FPS drops.
 */
export type Tier = "high" | "mid" | "low";

export const TIER_SETTINGS: Record<
  Tier,
  { nodes: number; packets: number; dust: number; dpr: [number, number]; bloom: boolean }
> = {
  high: { nodes: 72, packets: 220, dust: 900, dpr: [1, 1.75], bloom: true },
  mid: { nodes: 56, packets: 120, dust: 420, dpr: [1, 1.5], bloom: false },
  low: { nodes: 36, packets: 48, dust: 140, dpr: [1, 1], bloom: false },
};

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

export function detectTier(): Tier {
  if (typeof window === "undefined") return "mid";
  const nav = navigator as NavigatorHints;
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = window.innerWidth < 768;

  if (nav.connection?.saveData) return "low";
  if (cores <= 4 || memory <= 2) return "low";
  if (coarse || small) return "mid";
  if (cores >= 8 && memory >= 8) return "high";
  return "mid";
}

export function stepDown(tier: Tier): Tier {
  return tier === "high" ? "mid" : "low";
}
