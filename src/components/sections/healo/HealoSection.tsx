import { healo } from "@/content/content";
import SplitReveal from "@/components/ui/SplitReveal";
import Collaborations from "./Collaborations";
import HealoStage from "./HealoStage";
import ImpactStats from "./ImpactStats";

/** The flagship case study: intro, pinned stage, collaborators, impact. */
export default function HealoSection() {
  return (
    <section id="healo" aria-labelledby="healo-title" className="relative z-10 border-t border-line/60 bg-base">
      {/* ── Intro ──────────────────────────────────────────────────────── */}
      <header className="container-x grid gap-10 pt-(--section-y) pb-16 lg:grid-cols-12 lg:pb-4">
        <div className="lg:col-span-7">
          <p className="text-mono-label mb-6 flex items-center gap-3 text-lo">
            <span className="text-ember">{healo.index}</span>
            <span className="h-px w-8 bg-line" aria-hidden="true" />
            {healo.kicker}
          </p>
          <SplitReveal as="h2" id="healo-title" by="words" className="text-display-l text-hi">
            {healo.name}
          </SplitReveal>
          <SplitReveal as="p" by="lines" delay={0.15} className="text-h3 mt-6 max-w-[22ch] text-md">
            {healo.tagline.map((s, i) => (
              <span key={i} className={s.em ? "human text-hi" : undefined}>
                {s.text}{" "}
              </span>
            ))}
          </SplitReveal>
        </div>
        <div className="flex flex-col justify-end gap-6 lg:col-span-5">
          <p className="text-mono-label text-lo">{healo.role}</p>
          <SplitReveal as="p" by="lines" className="text-lead text-md">
            {healo.intro}
          </SplitReveal>
        </div>
      </header>

      <HealoStage />
      <Collaborations />
      <ImpactStats />
    </section>
  );
}
