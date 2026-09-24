/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  content.ts — the single source of truth for every word on the site.
 *
 *  Edit copy here; components never hard-code text. Anything marked
 *  `[ADD]` is a placeholder waiting for a real value.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ── Types ─────────────────────────────────────────────────────────────── */

/** A run of headline text. `em` renders in the Instrument Serif italic "human" voice. */
export type Segment = { text: string; em?: boolean };

export type Link = { label: string; href: string };

export type Stat = {
  /** Number the counter animates towards. */
  value: number;
  /** Where the counter starts (e.g. latency counts *down* to its value). */
  from?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  /** Mono footnote under the number. */
  note?: string;
};

export type ArchNodeId = "client" | "transport" | "api" | "bot" | "ai" | "data";

export type ArchNode = {
  id: ArchNodeId;
  label: string;
  /** Mono sub-label: the actual tech. */
  tech: string;
};

export type ArchStep = {
  /** Nodes lit while this step is active. */
  nodes: ArchNodeId[];
  kicker: string;
  title: string;
  points: string[];
};

export type ChatScenario = {
  user: string;
  /** Each regenerate cycles to the next reply. */
  replies: string[];
};

export type Collaboration = {
  with: string;
  title: string;
  body: string;
};

export type Role = {
  company: string;
  role: string;
  start: string; // ISO yyyy-mm
  end: string | null; // null = present
  display: string; // human-readable range
  note?: string;
  href?: string;
  remote?: boolean;
};

/* ── Site / identity ──────────────────────────────────────────────────── */

export const site = {
  name: "Anmol Bisht",
  title: "Lead Full Stack Engineer @ Infiheal",
  shortTitle: "Lead Full Stack Engineer",
  location: "Noida, India",
  timezone: "Asia/Kolkata",
  email: "anmolbisht7@gmail.com",
  linkedin: "https://www.linkedin.com/in/anmolbisht",
  /** [ADD] your GitHub profile URL. Links are hidden while this is empty. */
  github: "",
  /** [ADD] drop your résumé at /public/resume.pdf. */
  resume: "/resume.pdf",
  /**
   * Canonical URL. Falls back to Vercel's production URL automatically;
   * set NEXT_PUBLIC_SITE_URL once you have a custom domain.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  tagline:
    "Lead Full Stack Engineer building scalable, real-time web platforms used by 100k+ users.",
  description:
    "Anmol Bisht — Lead Full Stack Engineer at Infiheal. I build real-time, AI-powered platforms with MERN, Next.js, TypeScript and WebSockets, including Healo, an AI coach for emotional health used by 100k+ people.",
  keywords: [
    "Anmol Bisht",
    "Full Stack Engineer",
    "Next.js",
    "React",
    "TypeScript",
    "Node.js",
    "WebSockets",
    "Real-time systems",
    "MERN",
    "Go",
    "Infiheal",
    "Healo",
  ],
} as const;

export const nav: Link[] = [
  { label: "Healo", href: "#healo" },
  { label: "Stack", href: "#stack" },
  { label: "Log", href: "#experience" },
  { label: "Work", href: "#work" },
  { label: "Contact", href: "#contact" },
];

/* ── Hero ─────────────────────────────────────────────────────────────── */

export const hero = {
  eyebrow: "Anmol Bisht — Lead Full Stack Engineer @ Infiheal",
  headline: [
    { text: "Real-time" },
    { text: "systems" },
    { text: "for" },
    { text: "human", em: true },
    { text: "conversations." },
  ] satisfies Segment[],
  lead: site.tagline,
  readout: [
    { key: "latency", value: "<100ms" },
    { key: "users", value: "100k+" },
  ],
  scrollCue: "scroll to connect",
};

/* ── About ────────────────────────────────────────────────────────────── */

export const about = {
  kicker: "About",
  lines: [
    "I've spent 2+ years building real-time, AI-powered platforms.",
    "I own systems end-to-end: architecture, performance, deployment and mentoring.",
    "Mostly MERN, Next.js, TypeScript and WebSockets, with growing depth in Go and backend system design.",
    "My chat systems stream in under 100ms. My dashboards are used across product and business teams.",
  ],
  location: "Based in Noida, India",
  education: {
    degree: "B.Tech, Information Technology",
    school: "JSS Academy of Technical Education, Noida",
    years: "2020 – 2024",
  },
};

/* ── Healo (flagship) ─────────────────────────────────────────────────── */

export const healo = {
  index: "01",
  kicker: "Flagship · Infiheal",
  name: "Healo",
  tagline: [
    { text: "The world's most advanced AI coach for" },
    { text: "emotional health & happiness.", em: true },
  ] satisfies Segment[],
  role: "Architected end-to-end · MERN · 2023 → now",
  intro:
    "I architected Healo's full-stack platform end-to-end. That covers real-time chat streaming, regeneration, the Bot Framework integration and the AWS infrastructure behind it. It carries some of the most sensitive conversations people have, so it has to be fast, and it has to be gentle.",

  /** Architecture diagram nodes. Rename freely; ids drive the layout. */
  arch: [
    { id: "client", label: "Client", tech: "React · Next.js" },
    { id: "transport", label: "Stream", tech: "WebSocket · DirectLine" },
    { id: "api", label: "API", tech: "Node.js · Express" },
    { id: "bot", label: "Bot layer", tech: "MS Bot Framework" },
    { id: "ai", label: "AI model", tech: "ML · conversational" },
    { id: "data", label: "Data", tech: "MongoDB · AWS" },
  ] satisfies ArchNode[],

  /** Scroll chapters of the pinned case study (one per ~viewport of scroll). */
  steps: [
    {
      nodes: ["client"],
      kicker: "01 · Interface",
      title: "A calm surface for hard moments",
      points: [
        "Chat UI built with designers for empathetic, low-anxiety conversations",
        "Token-by-token streaming and one-tap regeneration",
      ],
    },
    {
      nodes: ["client", "transport"],
      kicker: "02 · Transport",
      title: "Sub-100ms, both directions",
      points: [
        "Real-time chat streaming over WebSockets",
        "DirectLine channel into Microsoft Bot Framework",
      ],
    },
    {
      nodes: ["transport", "api"],
      kicker: "03 · API",
      title: "The backbone",
      points: [
        "Robust Node/Express APIs for chatbot features",
        "Data management and internal endpoints for dashboards",
      ],
    },
    {
      nodes: ["api", "bot", "ai"],
      kicker: "04 · Intelligence",
      title: "Models, made clinically sound",
      points: [
        "Integrated ML models into the conversational flow",
        "Worked with the AI team on optimisation and with psychologists on response safety",
      ],
    },
    {
      nodes: ["api", "data"],
      kicker: "05 · Data & infra",
      title: "Everything that keeps it running",
      points: [
        "MongoDB data layer with internal visualisation dashboards",
        "AWS image builds, storage and infrastructure",
      ],
    },
  ] satisfies ArchStep[],

  /**
   * Chat demo. These replies are illustrative, written to show the streaming
   * and regeneration UX. They are not Healo's actual model output.
   */
  chat: {
    title: "Healo",
    status: "online",
    disclaimer: "Illustrative demo · not real Healo output",
    scenarios: [
      {
        user: "Work has been overwhelming lately and I can't switch off at night.",
        replies: [
          "That sounds exhausting, carrying the day with you long after it's over. You're not alone in this. When your mind keeps running at night, it's often trying to hold on to things it's afraid of forgetting. Would it help to try a two-minute \"brain dump\" before bed, writing down everything that's looping so it has somewhere to go?",
          "I'm really glad you shared that. Not being able to switch off is your nervous system still in \"work mode\". It isn't a personal failing. One small thing that helps many people is a short wind-down ritual: the same few minutes, every night, that tell your body the day is done. What does the last hour before sleep usually look like for you?",
          "It makes sense that you're feeling this way. When work keeps spilling over, rest can start to feel like another task. Let's go gently. Could you name the one thought that shows up most at night? Sometimes just naming it takes a little of its weight away.",
        ],
      },
    ] satisfies ChatScenario[],
  },

  collaborations: [
    {
      with: "AI team",
      title: "Model optimisation",
      body: "Partnered on integrating and tuning models so they stay responsive at conversation speed.",
    },
    {
      with: "Psychologists",
      title: "Clinically sound responses",
      body: "Worked with clinicians to make sure what the product says is safe, supportive and responsible.",
    },
    {
      with: "Designers",
      title: "Empathetic interface",
      body: "Built UI for sensitive mental-health conversations, where every delay and every word is felt.",
    },
    {
      with: "Interns",
      title: "Mentoring",
      body: "Mentored interns through agile delivery, code review and owning real features in production.",
    },
  ] satisfies Collaboration[],

  stats: [
    { value: 100, suffix: "k+", label: "users", note: "on the platform" },
    { value: 100, from: 480, prefix: "<", suffix: "ms", label: "chat latency", note: "real-time streaming" },
    { value: 2, label: "promotions", note: "intern → lead in 13 months" },
    { value: 2, suffix: "+", label: "years", note: "building Healo" },
  ] satisfies Stat[],

  alsoBuilt: [
    "Company website in Angular with interactive tests and a dynamic blog",
    "Multiple internal dashboards for data visualisation and management",
  ],
};

/* ── Skills (system map) ──────────────────────────────────────────────── */

export const skills = {
  groups: [
    { id: "frontend", label: "Frontend", items: ["React", "Next.js", "TypeScript", "Angular"] },
    { id: "backend", label: "Backend", items: ["Node.js", "Express.js", "Go", "REST APIs", "System design"] },
    { id: "realtime", label: "Real-time", items: ["WebSockets", "Chat streaming", "Bot Framework", "DirectLine"] },
    { id: "data", label: "Data", items: ["MongoDB", "Dashboards & dataviz", "Web analytics"] },
    { id: "cloud", label: "Cloud", items: ["AWS"] },
    { id: "ai", label: "AI", items: ["ML model integration", "Conversational products"] },
  ],
  leadership: ["Mentoring interns", "Agile delivery", "Bridging AI · design · clinical · engineering"],
};

/* ── Experience ───────────────────────────────────────────────────────── */

export const experience: Role[] = [
  { company: "Infiheal", role: "Lead Full Stack Engineer", start: "2024-12", end: null, display: "Dec 2024 – Present" },
  { company: "Infiheal", role: "SDE", start: "2024-06", end: "2024-11", display: "Jun – Nov 2024" },
  { company: "Infiheal", role: "SDE Intern", start: "2023-11", end: "2024-06", display: "Nov 2023 – Jun 2024" },
  { company: "Blazpay", role: "Frontend Developer", start: "2023-09", end: "2023-11", display: "Sep – Nov 2023", note: "One-stop crypto financial platform" },
  { company: "Honchi Solution", role: "Frontend Web Developer", start: "2023-10", end: "2023-10", display: "Oct 2023", note: "honchi.ai", href: "https://honchi.ai" },
  { company: "MasterJi", role: "Web Developer", start: "2022-10", end: "2022-11", display: "Oct – Nov 2022" },
  { company: "OneOBit", role: "Web Developer", start: "2022-08", end: "2022-10", display: "Aug – Oct 2022", remote: true },
  { company: "Crime Free Bharat", role: "Associate SDE", start: "2022-04", end: "2022-06", display: "Apr – Jun 2022" },
];

/* ── Other work ───────────────────────────────────────────────────────── */

export const work = [
  {
    title: "Blazpay",
    kind: "Frontend · Crypto fintech",
    body: "Frontend for a one-stop crypto financial platform.",
    image: "", // [ADD screenshot] e.g. "/work/blazpay.jpg"
  },
  {
    title: "honchi.ai",
    kind: "Frontend · AI product",
    body: "Frontend web development for Honchi Solution.",
    href: "https://honchi.ai",
    image: "", // [ADD screenshot]
  },
  {
    title: "Infiheal website",
    kind: "Angular · Interactive tests · Blog",
    body: "Company website with interactive self-assessment tests and a dynamic blog.",
    image: "", // [ADD screenshot]
  },
  {
    title: "Internal dashboards",
    kind: "Data visualisation",
    body: "Dashboards for data visualisation and management, used across product and business teams.",
    image: "", // [ADD screenshot]
  },
];

/* ── Contact ──────────────────────────────────────────────────────────── */

export const contact = {
  kicker: "Open a connection",
  headline: [
    { text: "Let's build something" },
    { text: "that listens.", em: true },
  ] satisfies Segment[],
  body: "Real-time products, AI conversations, or a team that needs someone to own the whole stack. I'd love to hear about it.",
};
