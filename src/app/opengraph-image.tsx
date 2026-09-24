import { ImageResponse } from "next/og";
import { site } from "@/content/content";

export const alt = `${site.name}, ${site.shortTitle}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* A still frame of the hero network, drawn with plain positioned divs. */
const NODES: [number, number, number, boolean][] = [
  [820, 150, 10, false],
  [940, 110, 7, false],
  [1050, 190, 9, false],
  [880, 260, 16, true],
  [1010, 300, 8, false],
  [760, 300, 7, false],
  [930, 390, 9, false],
  [1080, 400, 7, false],
  [820, 440, 8, false],
  [990, 480, 14, true],
  [720, 200, 6, false],
  [1120, 280, 6, false],
];
const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [0, 3],
  [3, 4],
  [2, 4],
  [3, 5],
  [3, 6],
  [4, 7],
  [6, 8],
  [6, 9],
  [9, 7],
  [5, 10],
  [0, 10],
  [2, 11],
  [7, 11],
  [8, 9],
];

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "radial-gradient(circle at 75% 50%, #161b3d 0%, #0b0d1a 55%, #07080f 100%)",
        color: "#eceef8",
        fontFamily: "sans-serif",
      }}
    >
      {EDGES.map(([a, b], i) => {
        const [x1, y1] = NODES[a];
        const [x2, y2] = NODES[b];
        const len = Math.hypot(x2 - x1, y2 - y1);
        const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x1,
              top: y1,
              width: len,
              height: 1.5,
              background: "rgba(124,156,255,0.35)",
              transform: `rotate(${angle}deg)`,
              transformOrigin: "0 0",
            }}
          />
        );
      })}
      {NODES.map(([x, y, r, warm], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x - r,
            top: y - r,
            width: r * 2,
            height: r * 2,
            borderRadius: 999,
            background: warm ? "#ff9b6a" : "#c3d0ff",
            boxShadow: warm ? "0 0 30px #ff9b6a" : "0 0 18px #7c9cff",
          }}
        />
      ))}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 72, width: 720 }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, color: "#a6accb", letterSpacing: 2 }}
        >
          <div style={{ width: 12, height: 12, borderRadius: 999, background: "#ff9b6a" }} />
          LATENCY &lt;100MS · USERS 100K+
        </div>
        <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: -3, lineHeight: 1, marginTop: 28 }}>
          {site.name}
        </div>
        <div style={{ fontSize: 34, color: "#a6accb", marginTop: 18, lineHeight: 1.3 }}>{site.title}</div>
        <div style={{ fontSize: 24, color: "#7a80a3", marginTop: 26, lineHeight: 1.4 }}>
          Real-time systems for human conversations.
        </div>
      </div>
    </div>,
    size,
  );
}
