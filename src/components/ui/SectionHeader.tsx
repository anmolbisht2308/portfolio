import type { Segment } from "@/content/content";
import SplitReveal from "./SplitReveal";

/** Numbered section opener: mono index + kicker, display title, optional intro. */
export default function SectionHeader({
  id,
  index,
  kicker,
  title,
  intro,
  className = "",
}: {
  id: string;
  index?: string;
  kicker: string;
  title: Segment[];
  intro?: string;
  className?: string;
}) {
  return (
    <header className={`grid gap-8 lg:grid-cols-12 lg:items-end ${className}`}>
      <div className="lg:col-span-8">
        <p className="text-mono-label mb-6 flex items-center gap-3 text-lo">
          {index ? <span className="text-ember">{index}</span> : null}
          <span className="h-px w-8 bg-line" aria-hidden="true" />
          {kicker}
        </p>
        <SplitReveal as="h2" id={id} by="words" className="text-h2 max-w-[18ch] text-hi">
          {title.map((s, i) => (
            <span key={i} className={s.em ? "human" : undefined}>
              {s.text}{" "}
            </span>
          ))}
        </SplitReveal>
      </div>
      {intro ? <p className="max-w-[40ch] text-md lg:col-span-4">{intro}</p> : null}
    </header>
  );
}
