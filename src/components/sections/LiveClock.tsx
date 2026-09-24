"use client";

import { useEffect, useRef } from "react";
import { site } from "@/content/content";

const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: site.timezone,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** Anmol's local time (IST), ticking in the readout like a server timestamp. */
export default function LiveClock() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const tick = () => {
      if (ref.current) ref.current.textContent = `${fmt.format(new Date())} IST`;
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  // Fixed-width placeholder avoids layout shift before hydration.
  return (
    <span ref={ref} className="inline-block min-w-[12ch]" suppressHydrationWarning>
      --:--:-- IST
    </span>
  );
}
