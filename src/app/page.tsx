import dynamic from "next/dynamic";
import { Suspense } from "react";
import { site } from "@/content/content";
import Footer from "@/components/global/Footer";
import Nav from "@/components/global/Nav";
import About from "@/components/sections/about/About";
import HealoSection from "@/components/sections/healo/HealoSection";
import Hero from "@/components/sections/Hero";
import SceneDirector from "@/components/three/SceneDirector";
import SceneMount from "@/components/three/SceneMount";

/*
 * Below-the-fold sections are still server-rendered (full HTML for SEO and
 * no layout shift) but split into their own chunks.
 *
 * Every section also sits in its own <Suspense> boundary so React hydrates
 * them one at a time, yielding to the main thread in between, instead of
 * one long blocking task. Boundaries hydrate in document order, so pinned
 * sections (About, Healo) still create their pins before any trigger below.
 */
const Skills = dynamic(() => import("@/components/sections/skills/Skills"));
const Experience = dynamic(() => import("@/components/sections/experience/Experience"));
const Activity = dynamic(() => import("@/components/sections/activity/Activity"));
const Work = dynamic(() => import("@/components/sections/work/Work"));
const Contact = dynamic(() => import("@/components/sections/contact/Contact"));

// Re-render (and re-fetch the GitHub calendar) at most once a day.
export const revalidate = 86400;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  jobTitle: site.shortTitle,
  image: `${site.url}/anmol.jpg`,
  worksFor: { "@type": "Organization", name: "Infiheal" },
  email: `mailto:${site.email}`,
  url: site.url,
  address: { "@type": "PostalAddress", addressLocality: "Noida", addressCountry: "IN" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "JSS Academy of Technical Education, Noida" },
  sameAs: [site.linkedin, site.github].filter(Boolean),
  knowsAbout: site.keywords.slice(2),
  description: site.description,
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SceneMount />
      <SceneDirector />
      <Nav />
      <main id="main">
        {[Hero, About, HealoSection, Skills, Experience, Activity, Work, Contact].map((Section, i) => (
          <Suspense key={i}>
            <Section />
          </Suspense>
        ))}
      </main>
      <Footer />
    </>
  );
}
