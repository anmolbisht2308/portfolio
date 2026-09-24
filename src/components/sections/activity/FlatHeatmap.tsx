import { LEVEL_HEX, PEAK_HEX, type Cell } from "./calendar";

/** Lightweight 2D calendar: placeholder while WebGL loads, and the no-WebGL fallback. */
export default function FlatHeatmap({ cells }: { cells: Cell[] }) {
  const max = Math.max(1, ...cells.map((c) => c.count));
  return (
    <svg viewBox={`0 0 ${54 * 12} ${7 * 12}`} className="h-auto w-full max-w-4xl opacity-80">
      {cells.map((c) => (
        <rect
          key={c.date}
          x={c.week * 12}
          y={c.weekday * 12}
          width={10}
          height={10}
          rx={2}
          fill={c.count === max ? PEAK_HEX : LEVEL_HEX[c.level]}
        />
      ))}
    </svg>
  );
}
