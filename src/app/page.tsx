import { contact, site } from "@/content/content";
import Nav from "@/components/global/Nav";
import Hero from "@/components/sections/Hero";
import HealoSection from "@/components/sections/healo/HealoSection";
import SceneDirector from "@/components/three/SceneDirector";
import SceneMount from "@/components/three/SceneMount";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  jobTitle: site.shortTitle,
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
        <Hero />
        <HealoSection />
        {/* About, Stack, Experience, Work and Contact are the next sections to build. */}
        <section id="contact" aria-label="Contact" className="relative z-10 border-t border-line/60 bg-base">
          <div className="container-x py-24">
            <p className="text-mono-label text-lo">{contact.kicker}</p>
            <a href={`mailto:${site.email}`} className="mt-4 inline-block font-display text-[clamp(1.5rem,6.5vw,4rem)] font-semibold tracking-tight break-all text-hi hover:text-ember">
              {site.email}
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
