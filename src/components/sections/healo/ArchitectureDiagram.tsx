"use client";

import { useEffect, useRef } from "react";
import { healo, type ArchNodeId } from "@/content/content";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { easeInOutCubic, lerp } from "@/lib/motion";
import { chatBus } from "./chat-bus";

/* ── Layout (viewBox 360 × 560) ────────────────────────────────────────── */

const W = 360;
const H = 560;
const NODE_W = 164;
const NODE_H = 54;

const POS: Record<ArchNodeId, { x: number; y: number }> = {
  client: { x: 180, y: 48 },
  transport: { x: 180, y: 160 },
  api: { x: 180, y: 272 },
  bot: { x: 96, y: 396 },
  data: { x: 264, y: 396 },
  ai: { x: 96, y: 510 },
};

type EdgeId = "ct" | "ta" | "ab" | "bi" | "ad";
const EDGES: Record<EdgeId, { from: ArchNodeId; to: ArchNodeId; d: string }> = {
  ct: { from: "client", to: "transport", d: `M180,${48 + 27} L180,${160 - 27}` },
  ta: { from: "transport", to: "api", d: `M180,${160 + 27} L180,${272 - 27}` },
  ab: { from: "api", to: "bot", d: `M180,${272 + 27} C180,340 96,330 96,${396 - 27}` },
  ad: { from: "api", to: "data", d: `M180,${272 + 27} C180,340 264,330 264,${396 - 27}` },
  bi: { from: "bot", to: "ai", d: `M96,${396 + 27} L96,${510 - 27}` },
};

/** [edge, forward?] hops. */
type Route = [EdgeId, boolean][];
const REQUEST: Route = [
  ["ct", true],
  ["ta", true],
  ["ab", true],
  ["bi", true],
];
const RESPONSE: Route = [
  ["bi", false],
  ["ab", false],
  ["ta", false],
  ["ct", false],
];
/** The scroll "tour": client → … → model, back up, then down to data. */
const TOUR: Route = [
  ["ct", true],
  ["ta", true],
  ["ab", true],
  ["bi", true],
  ["bi", false],
  ["ab", false],
  ["ad", true],
];

const POOL = 40;

type Packet = {
  route: Route;
  hop: number;
  dist: number;
  speed: number; // px / s
  kind: "human" | "token" | "ambient";
};

/**
 * Architecture diagram with live traffic.
 * - Ambient packets trickle along random edges while on screen.
 * - Chat events route real "request" (warm) and "token" (cool) packets.
 * - A scroll-driven packet tours the system as the case study progresses.
 * All drawing is imperative (setAttribute on a pooled set of circles) so
 * no React renders happen per frame.
 */
export default function ArchitectureDiagram({
  activeNodes,
  progress,
}: {
  activeNodes: ArchNodeId[];
  /** Mutable scroll progress (0..1) written by the parent's ScrollTrigger. */
  progress: { current: number };
}) {
  const reduced = useReducedMotion();
  const svg = useRef<SVGSVGElement>(null);
  const paths = useRef<Partial<Record<EdgeId, SVGPathElement>>>({});
  const rings = useRef<Partial<Record<ArchNodeId, SVGRectElement>>>({});
  const pool = useRef<(SVGCircleElement | null)[]>([]);
  const tourDot = useRef<SVGGElement>(null);

  useEffect(() => {
    const root = svg.current;
    if (!root) return;

    const lengths = Object.fromEntries(
      (Object.keys(EDGES) as EdgeId[]).map((id) => [id, paths.current[id]!.getTotalLength()]),
    ) as Record<EdgeId, number>;
    const tourTotal = TOUR.reduce((sum, [e]) => sum + lengths[e], 0);

    const pointOn = (edge: EdgeId, forward: boolean, dist: number) => {
      const len = lengths[edge];
      return paths.current[edge]!.getPointAtLength(forward ? dist : len - dist);
    };

    /** "Ack": a node's ring flashes when a packet arrives. */
    const ack = (node: ArchNodeId, kind: Packet["kind"]) => {
      const el = rings.current[node];
      if (!el || reduced || kind === "ambient") return;
      const warm = kind === "human";
      el.animate(
        [
          { stroke: warm ? "#ff9b6a" : "#7c9cff", strokeOpacity: warm ? 1 : 0.6, strokeWidth: warm ? 2 : 1 },
          { stroke: warm ? "#ff9b6a" : "#7c9cff", strokeOpacity: 0, strokeWidth: 1 },
        ],
        { duration: warm ? 900 : 400, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      );
    };

    const packets: (Packet | null)[] = Array(POOL).fill(null);
    const spawn = (route: Route, kind: Packet["kind"], speed: number) => {
      const slot = packets.findIndex((p) => p === null);
      if (slot === -1) return; // pool exhausted: drop, like a rate-limited stream
      packets[slot] = { route, hop: 0, dist: 0, speed, kind };
    };

    const edgeIds = Object.keys(EDGES) as EdgeId[];
    let ambientClock = 0;
    let tokenSkip = 0;
    let shownTour = progress.current;
    let visible = false;

    const off = chatBus.on((e) => {
      if (!visible || reduced) return;
      if (e === "request") spawn(REQUEST, "human", 620);
      if (e === "token" && tokenSkip++ % 2 === 0) spawn(RESPONSE, "token", 700);
    });

    const tick = (_t: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 1 / 20);

      // Ambient trickle: one packet every ~0.7s on a random edge.
      ambientClock += dt;
      if (ambientClock > 0.7) {
        ambientClock = 0;
        const e = edgeIds[Math.floor(Math.random() * edgeIds.length)];
        spawn([[e, Math.random() > 0.35]], "ambient", 150 + Math.random() * 90);
      }

      for (let i = 0; i < POOL; i++) {
        const el = pool.current[i];
        const p = packets[i];
        if (!el) continue;
        if (!p) {
          el.setAttribute("r", "0");
          continue;
        }
        p.dist += p.speed * dt;
        let [edge, fwd] = p.route[p.hop];
        while (p.dist >= lengths[edge]) {
          p.dist -= lengths[edge];
          const arrived = fwd ? EDGES[edge].to : EDGES[edge].from;
          ack(arrived, p.kind);
          p.hop++;
          if (p.hop >= p.route.length) break;
          [edge, fwd] = p.route[p.hop];
        }
        if (p.hop >= p.route.length) {
          packets[i] = null;
          el.setAttribute("r", "0");
          continue;
        }
        const pt = pointOn(edge, fwd, p.dist);
        el.setAttribute("cx", pt.x.toFixed(1));
        el.setAttribute("cy", pt.y.toFixed(1));
        el.setAttribute("r", p.kind === "human" ? "5" : p.kind === "token" ? "2.6" : "2.2");
        el.setAttribute(
          "class",
          p.kind === "human" ? "fill-ember" : p.kind === "token" ? "fill-signal-core" : "fill-signal",
        );
      }

      // Scroll tour packet: eases toward the scroll position.
      shownTour = lerp(shownTour, progress.current, 1 - Math.pow(0.004, dt));
      let d = easeInOutCubic(Math.min(1, Math.max(0, shownTour))) * tourTotal;
      for (const [e, fwd] of TOUR) {
        if (d <= lengths[e]) {
          const pt = pointOn(e, fwd, d);
          tourDot.current?.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
          break;
        }
        d -= lengths[e];
      }
    };

    // Only animate while the diagram is on screen.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (reduced) {
        tick(0, 0); // place the tour dot once
        return;
      }
      if (visible) gsap.ticker.add(tick);
      else gsap.ticker.remove(tick);
    });
    io.observe(root);

    return () => {
      io.disconnect();
      gsap.ticker.remove(tick);
      off();
    };
  }, [reduced, progress]);

  const isActive = (id: ArchNodeId) => activeNodes.includes(id);
  const edgeActive = (id: EdgeId) => isActive(EDGES[id].from) && isActive(EDGES[id].to);

  return (
    <figure className="relative mx-auto w-full max-w-[26rem]">
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto max-h-[calc(100svh-10rem)] w-full overflow-visible"
        role="img"
        aria-labelledby="arch-title arch-desc"
      >
        <title id="arch-title">Healo system architecture</title>
        <desc id="arch-desc">
          The client connects over WebSocket and DirectLine to a Node.js and Express API. The API talks to the Microsoft
          Bot Framework, which calls the AI model, and to MongoDB on AWS for data.
        </desc>

        <defs>
          <filter id="packet-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {(Object.keys(EDGES) as EdgeId[]).map((id) => (
          <g key={id}>
            <path d={EDGES[id].d} fill="none" stroke="var(--color-line)" strokeWidth={1.5} />
            <path
              ref={(el) => {
                if (el) paths.current[id] = el;
              }}
              d={EDGES[id].d}
              fill="none"
              stroke="var(--color-signal)"
              strokeWidth={1.5}
              strokeDasharray="3 5"
              className="transition-opacity duration-(--dur-slow)"
              style={{ opacity: edgeActive(id) ? 0.9 : 0.18 }}
            />
          </g>
        ))}

        {/* Packets (pooled) */}
        <g filter="url(#packet-glow)">
          {Array.from({ length: POOL }, (_, i) => (
            <circle
              key={i}
              ref={(el) => {
                pool.current[i] = el;
              }}
              r={0}
            />
          ))}
        </g>

        {/* Nodes */}
        {healo.arch.map((n) => {
          const { x, y } = POS[n.id];
          const on = isActive(n.id);
          return (
            <g
              key={n.id}
              transform={`translate(${x - NODE_W / 2} ${y - NODE_H / 2})`}
              className="transition-opacity duration-(--dur-slow) ease-(--ease-signal)"
              style={{ opacity: on ? 1 : 0.5 }}
            >
              <rect
                width={NODE_W}
                height={NODE_H}
                rx={12}
                fill={on ? "var(--color-raised)" : "var(--color-surface)"}
                stroke={on ? "var(--color-signal)" : "var(--color-line)"}
                strokeWidth={1}
                className="transition-[fill,stroke] duration-(--dur-slow)"
              />
              {/* Ack ring, flashed via WAAPI when packets arrive */}
              <rect
                ref={(el) => {
                  if (el) rings.current[n.id] = el;
                }}
                x={-3}
                y={-3}
                width={NODE_W + 6}
                height={NODE_H + 6}
                rx={15}
                fill="none"
                stroke="transparent"
              />
              <text x={14} y={23} className="fill-hi font-display text-[15px] font-semibold">
                {n.label}
              </text>
              <text x={14} y={41} className="fill-lo font-mono text-[10px] tracking-wide">
                {n.tech}
              </text>
              <circle cx={NODE_W - 16} cy={18} r={3} className={on ? "fill-ember" : "fill-line"} />
            </g>
          );
        })}

        {/* Scroll tour packet */}
        <g ref={tourDot} transform={`translate(${POS.client.x} ${POS.client.y + 27})`} aria-hidden="true">
          <circle r={9} className="fill-ember/15" />
          <circle r={4} className="fill-ember" filter="url(#packet-glow)" />
        </g>
      </svg>
      <figcaption className="text-mono-label mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-lo">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-ember" aria-hidden="true" /> human message
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-signal-core" aria-hidden="true" /> streamed tokens
        </span>
      </figcaption>
    </figure>
  );
}
