import { healo } from "@/content/content";
import Counter from "@/components/ui/Counter";

/** Impact numbers: server-rendered final values, counted up on scroll. */
export default function ImpactStats() {
  return (
    <div className="container-x pt-(--section-y) pb-(--section-y)">
      <p className="text-mono-label mb-8 text-lo">Impact</p>
      <dl className="grid grid-cols-2 border-t border-line lg:grid-cols-4">
        {healo.stats.map((s, i) => (
          <div
            key={s.label}
            className={`flex flex-col-reverse gap-3 border-b border-line py-8 pr-4 lg:border-b-0 lg:py-10 ${
              i % 2 === 1 ? "pl-4 lg:pl-0" : ""
            } ${i > 0 ? "lg:border-l lg:pl-6" : ""} ${i % 2 === 1 ? "border-l lg:border-l" : ""}`}
          >
            <dt>
              <span className="block text-hi">{s.label}</span>
              {s.note ? <span className="text-mono-label mt-1 block text-lo">{s.note}</span> : null}
            </dt>
            <dd className="font-display text-[clamp(2.25rem,1.4rem+3.6vw,5rem)] leading-none font-semibold tracking-tight text-hi">
              <Counter to={s.value} from={s.from} prefix={s.prefix} suffix={s.suffix} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
