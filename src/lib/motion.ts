/**
 * Motion tokens shared by GSAP (registered as CustomEases), Motion (bezier
 * arrays / springs) and plain JS. Keep in sync with the CSS vars in globals.css.
 */

export const EASE_BEZIER = {
  /** expo-out: reveals, arrivals (default) */
  signal: [0.16, 1, 0.3, 1],
  /** in-out: packets in flight */
  transit: [0.65, 0, 0.35, 1],
  /** slight overshoot: node pulses, small UI moments */
  ack: [0.34, 1.56, 0.64, 1],
  /** in: exits */
  depart: [0.7, 0, 0.84, 0],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export const DUR = {
  instant: 0.12,
  fast: 0.24,
  base: 0.48,
  slow: 0.8,
  reveal: 1.1,
} as const;

export const STAGGER = { word: 0.055, line: 0.09 } as const;

export const SPRING = {
  cursor: { stiffness: 500, damping: 40, mass: 0.6 },
  magnetic: { stiffness: 150, damping: 15, mass: 0.1 },
  tilt: { stiffness: 200, damping: 20 },
} as const;

/** transit easing as a plain function, for per-frame JS (packets, rAF loops). */
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
