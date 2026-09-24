import { site } from "@/content/content";
import LiveClock from "@/components/sections/LiveClock";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-line/60">
      <div className="container-x text-mono-data flex flex-col gap-3 py-8 text-lo sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {site.name} · {site.location}
        </p>
        <p className="flex items-center gap-2">
          <span className="live-dot size-1.5!" aria-hidden="true" />
          <LiveClock />
        </p>
        <p>Next.js · React Three Fiber · GSAP</p>
      </div>
    </footer>
  );
}
