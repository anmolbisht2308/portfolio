/**
 * Deterministic network graph generation. Seeded so the constellation is the
 * same on every visit (and on server/client if ever needed).
 */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Graph = {
  count: number;
  /** Resting "live network" form: a loose ellipsoid shell. */
  shell: Float32Array;
  /** Calmer form: a flattened, evenly spaced ring (About section). */
  ring: Float32Array;
  /** 1 for hub/server nodes, 0 for clients. */
  hub: Float32Array;
  /** Flat [a0, b0, a1, b1, …] node indices. */
  edges: Uint16Array;
  /** adjacency[node] = list of edge indices touching that node. */
  adjacency: number[][];
  /** Per-node random seed 0..1 (used for size + breathing phase). */
  seed: Float32Array;
};

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

export function buildGraph(count: number, seedValue = 11): Graph {
  const rand = mulberry32(seedValue);
  const shell = new Float32Array(count * 3);
  const ring = new Float32Array(count * 3);
  const hub = new Float32Array(count);
  const seed = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Fibonacci sphere gives an even spread; jittered radius breaks the symmetry.
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = GOLDEN * i;
    const isHub = i % 9 === 4;
    const R = isHub ? 1.2 + rand() * 0.9 : 2.3 + rand() * 1.2;

    shell[i * 3] = Math.cos(theta) * r * R * 1.3;
    shell[i * 3 + 1] = y * R * 0.82;
    shell[i * 3 + 2] = Math.sin(theta) * r * R;

    // Ring: same angular order, laid out on a gently undulating flat band.
    const a = (i / count) * Math.PI * 2;
    const rr = 3.1 + (rand() - 0.5) * 0.5;
    ring[i * 3] = Math.cos(a) * rr * 1.2;
    ring[i * 3 + 1] = Math.sin(a * 3) * 0.18 + (rand() - 0.5) * 0.2;
    ring[i * 3 + 2] = Math.sin(a) * rr * 0.9;

    hub[i] = isHub ? 1 : 0;
    seed[i] = rand();
  }

  // k-nearest-neighbour wiring (hubs get more links), deduplicated.
  const pairs = new Set<number>();
  const dist2 = (a: number, b: number) => {
    const dx = shell[a * 3] - shell[b * 3];
    const dy = shell[a * 3 + 1] - shell[b * 3 + 1];
    const dz = shell[a * 3 + 2] - shell[b * 3 + 2];
    return dx * dx + dy * dy + dz * dz;
  };
  for (let i = 0; i < count; i++) {
    const k = hub[i] ? 5 : 2;
    const nearest = Array.from({ length: count }, (_, j) => j)
      .filter((j) => j !== i)
      .sort((a, b) => dist2(i, a) - dist2(i, b))
      .slice(0, k);
    for (const j of nearest) {
      const lo = Math.min(i, j);
      const hi = Math.max(i, j);
      pairs.add(lo * count + hi);
    }
  }

  const edges = new Uint16Array(pairs.size * 2);
  const adjacency: number[][] = Array.from({ length: count }, () => []);
  let e = 0;
  for (const key of pairs) {
    const a = Math.floor(key / count);
    const b = key % count;
    edges[e * 2] = a;
    edges[e * 2 + 1] = b;
    adjacency[a].push(e);
    adjacency[b].push(e);
    e++;
  }

  return { count, shell, ring, hub, edges, adjacency, seed };
}

export { mulberry32 };
