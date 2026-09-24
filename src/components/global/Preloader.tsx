"use client";

import { useEffect, useState } from "react";

/**
 * "Handshake" intro, ~1.1s. Timing lives in CSS (globals.css → .preloader)
 * so the page reveals even before hydration; this component only adds
 * click/keypress-to-skip and removes the node afterwards.
 * Returning visitors (same session) and reduced-motion users never see it.
 */
export default function Preloader() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    // Already hidden by CSS (html[data-intro="skip"]); nothing to orchestrate.
    if (root.dataset.intro === "skip") return;
    try {
      sessionStorage.setItem("intro-seen", "1");
    } catch {}

    const skip = () => {
      root.dataset.intro = "skip";
      setGone(true);
    };
    const done = setTimeout(() => setGone(true), 1300);
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      clearTimeout(done);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, []);

  if (gone) return null;

  return (
    <div className="preloader fixed inset-0 z-[100] grid place-items-center bg-void" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-0" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-signal-core shadow-[0_0_14px_var(--color-signal)]" />
          <span className="handshake-line h-px w-28 bg-gradient-to-r from-signal to-ember sm:w-40" />
          <span className="live-dot size-2.5!" />
        </div>
        <p className="text-mono-label text-lo">
          <span className="text-md">syn</span> → syn-ack → <span className="text-ember">ack</span>
          <span className="sr-only">. Press any key to skip.</span>
        </p>
      </div>
    </div>
  );
}
