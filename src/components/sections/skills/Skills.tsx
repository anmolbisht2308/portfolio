import { skills } from "@/content/content";
import SectionHeader from "@/components/ui/SectionHeader";
import SkillList from "./SkillList";
import SystemMap from "./SystemMap";

export default function Skills() {
  return (
    <section
      id="stack"
      aria-labelledby="stack-title"
      className="relative z-10 border-t border-line/60 bg-base py-(--section-y)"
    >
      <div className="container-x">
        <SectionHeader
          id="stack-title"
          index={skills.index}
          kicker={skills.kicker}
          title={skills.title}
          intro={skills.intro}
          className="mb-14 lg:mb-20"
        />
        <div className="hidden lg:block">
          <SystemMap />
        </div>
        <div className="lg:hidden">
          <SkillList />
        </div>
        <p className="text-mono-label mt-14 flex flex-wrap items-center gap-x-3 gap-y-2 text-lo">
          <span className="text-md">Leadership</span>
          {skills.leadership.map((l) => (
            <span key={l} className="flex items-center gap-3">
              <span className="h-px w-4 bg-line" aria-hidden="true" />
              {l}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
