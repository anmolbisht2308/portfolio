import { activity, site } from "@/content/content";
import { getContributions } from "@/lib/github";
import SectionHeader from "@/components/ui/SectionHeader";
import ActivityView from "./ActivityView";

/** Server component: fetches the calendar at build time (revalidated daily). */
export default async function Activity() {
  const data = await getContributions(site.githubUsername, activity.fromYear);
  return (
    <section
      id="activity"
      aria-labelledby="activity-title"
      className="relative z-10 border-t border-line/60 bg-base py-(--section-y)"
    >
      <div className="container-x">
        <SectionHeader
          id="activity-title"
          index={activity.index}
          kicker={activity.kicker}
          title={activity.title}
          intro={activity.intro}
          className="mb-12 lg:mb-16"
        />
        <ActivityView data={data} />
      </div>
    </section>
  );
}
