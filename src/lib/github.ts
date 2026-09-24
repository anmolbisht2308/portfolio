/**
 * GitHub contribution calendar, fetched on the server (build time + daily
 * ISR revalidation). Never runs in the browser, so no token is exposed.
 *
 * Sources, in order:
 *  1. GitHub GraphQL API: official, needs `GITHUB_TOKEN` (a classic or
 *     fine-grained token with no scopes is enough for public data).
 *  2. github-contributions-api.jogruber.de: public, no token.
 *  3. Deterministic sample data, clearly labelled on the page, so a network
 *     hiccup at build time never breaks the deploy.
 */

export type Level = 0 | 1 | 2 | 3 | 4;
export type ContributionDay = { date: string; count: number; level: Level };
export type YearStats = {
  total: number;
  activeDays: number;
  longestStreak: number;
  busiest: { date: string; count: number } | null;
};
export type ContributionYear = { year: number; days: ContributionDay[]; stats: YearStats };
export type Contributions = {
  username: string;
  source: "github" | "public" | "sample";
  /** ISO date the data was fetched (shown as "updated"). */
  fetchedAt: string;
  years: ContributionYear[];
};

const REVALIDATE = 60 * 60 * 24; // daily
const TIMEOUT = 8000;

const todayISO = () => new Date().toISOString().slice(0, 10);

/* ── Sources ─────────────────────────────────────────────────────────── */

const LEVELS: Record<string, Level> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

async function fromGraphQL(user: string, year: number, token: string): Promise<ContributionDay[]> {
  const query = `query($login:String!,$from:DateTime!,$to:DateTime!){
    user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{
      weeks{contributionDays{date contributionCount contributionLevel}}}}}}`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { login: user, from: `${year}-01-01T00:00:00Z`, to: `${year}-12-31T23:59:59Z` },
    }),
    next: { revalidate: REVALIDATE },
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`);
  const json = (await res.json()) as {
    data?: {
      user?: {
        contributionsCollection: {
          contributionCalendar: {
            weeks: { contributionDays: { date: string; contributionCount: number; contributionLevel: string }[] }[];
          };
        };
      };
    };
  };
  const weeks = json.data?.user?.contributionsCollection.contributionCalendar.weeks;
  if (!weeks) throw new Error("GitHub GraphQL: user not found");
  return weeks
    .flatMap((w) => w.contributionDays)
    .map((d) => ({ date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0 }));
}

async function fromPublic(user: string, year: number): Promise<ContributionDay[]> {
  const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(user)}?y=${year}`, {
    next: { revalidate: REVALIDATE },
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) throw new Error(`contributions API ${res.status}`);
  const json = (await res.json()) as { contributions?: { date: string; count: number; level: number }[] };
  if (!json.contributions) throw new Error("contributions API: bad payload");
  return json.contributions.map((d) => ({
    date: d.date,
    count: d.count,
    level: Math.min(4, Math.max(0, d.level)) as Level,
  }));
}

/** Seeded, plausible-looking calendar. Only used when both sources fail. */
function sample(year: number): ContributionDay[] {
  let seed = year * 9301 + 49297;
  const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const days: ContributionDay[] = [];
  for (let d = new Date(Date.UTC(year, 0, 1)); d.getUTCFullYear() === year; d.setUTCDate(d.getUTCDate() + 1)) {
    const weekday = d.getUTCDay();
    const busy = weekday > 0 && weekday < 6 ? 0.75 : 0.35;
    const count = rand() < busy ? Math.floor(Math.pow(rand(), 2) * 14) + 1 : 0;
    days.push({ date: d.toISOString().slice(0, 10), count, level: 0 });
  }
  return days.map((d) => ({
    ...d,
    level: (d.count === 0 ? 0 : d.count < 3 ? 1 : d.count < 6 ? 2 : d.count < 10 ? 3 : 4) as Level,
  }));
}

/* ── Stats ───────────────────────────────────────────────────────────── */

function stats(days: ContributionDay[]): YearStats {
  let total = 0;
  let activeDays = 0;
  let streak = 0;
  let longestStreak = 0;
  let busiest: YearStats["busiest"] = null;
  for (const d of days) {
    total += d.count;
    if (d.count > 0) {
      activeDays++;
      streak++;
      longestStreak = Math.max(longestStreak, streak);
      if (!busiest || d.count > busiest.count) busiest = { date: d.date, count: d.count };
    } else streak = 0;
  }
  return { total, activeDays, longestStreak, busiest };
}

/* ── Public API ──────────────────────────────────────────────────────── */

export async function getContributions(username: string, fromYear: number): Promise<Contributions> {
  const current = new Date().getUTCFullYear();
  const years = Array.from({ length: current - fromYear + 1 }, (_, i) => fromYear + i);
  const today = todayISO();
  const token = process.env.GITHUB_TOKEN;

  type Attempt = [Contributions["source"], (y: number) => Promise<ContributionDay[]>];
  const attempts: Attempt[] = [["public", (y) => fromPublic(username, y)]];
  if (token) attempts.unshift(["github", (y) => fromGraphQL(username, y, token)]);

  for (const [source, load] of attempts) {
    try {
      const all = await Promise.all(years.map(load));
      return {
        username,
        source,
        fetchedAt: today,
        years: years.map((year, i) => {
          // Keep only this calendar year and nothing after today.
          const days = all[i].filter((d) => d.date.startsWith(`${year}-`) && d.date <= today);
          return { year, days, stats: stats(days) };
        }),
      };
    } catch (err) {
      console.warn(`[github] ${source} contributions unavailable:`, (err as Error).message);
    }
  }

  return {
    username,
    source: "sample",
    fetchedAt: today,
    years: years.map((year) => {
      const days = sample(year).filter((d) => d.date <= today);
      return { year, days, stats: stats(days) };
    }),
  };
}
