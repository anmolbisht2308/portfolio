import { nav, site } from "@/content/content";

/** Fixed top bar: monogram with a live dot, section links, résumé. */
export default function Nav() {
  return (
    <header className="fade-up fixed inset-x-0 top-0 z-40" style={{ "--d": "300ms" } as React.CSSProperties}>
      <div className="container-x flex h-(--nav-h) items-center justify-between">
        <a href="#top" className="group flex items-center gap-3 rounded-full">
          <span className="font-display text-lg font-semibold tracking-tight text-hi">AB</span>
          <span className="sr-only">{site.name}, back to top</span>
          <span className="live-dot" aria-hidden="true" />
          <span className="text-mono-label hidden text-lo sm:inline">online · {site.location}</span>
        </a>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-1 rounded-full border border-line/80 bg-base/60 p-1 backdrop-blur-md">
            {nav.map((l) => (
              <li key={l.href} className="hidden md:block">
                <a
                  href={l.href}
                  className="text-mono-label block rounded-full px-3.5 py-2 text-md transition-colors duration-(--dur-fast) hover:bg-raised hover:text-hi"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#contact"
                className="text-mono-label block rounded-full bg-ember px-4 py-2 text-void transition-colors duration-(--dur-fast) hover:bg-ember-soft md:hidden"
              >
                Contact
              </a>
              <a
                href={site.resume}
                className="text-mono-label hidden rounded-full bg-ember px-4 py-2 text-void transition-colors duration-(--dur-fast) hover:bg-ember-soft md:block"
              >
                Résumé ↓
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
