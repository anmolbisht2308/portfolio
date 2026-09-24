import type { Segment } from "@/content/content";

/**
 * Server-rendered word-by-word masked reveal (CSS only; no JS needed, so the
 * LCP headline paints as early as possible). `startIndex` offsets the stagger.
 */
export default function Headline({
  segments,
  id,
  as: Tag = "h1",
  className,
  startIndex = 0,
}: {
  segments: Segment[];
  id?: string;
  as?: "h1" | "h2" | "p";
  className?: string;
  startIndex?: number;
}) {
  let i = startIndex;
  return (
    <Tag id={id} className={className}>
      {segments.map((seg, s) =>
        seg.text.split(" ").map((word, w) => {
          const idx = i++;
          return (
            <span key={`${s}-${w}`}>
              <span className="reveal-word">
                <span className={seg.em ? "human pr-[0.06em]" : undefined} style={{ "--i": idx } as React.CSSProperties}>
                  {word}
                </span>
              </span>{" "}
            </span>
          );
        }),
      )}
    </Tag>
  );
}
