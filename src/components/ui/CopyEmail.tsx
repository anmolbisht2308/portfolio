"use client";

import { useEffect, useRef, useState } from "react";

/** Copies the address with an "ack" confirmation; falls back to mailto. */
export default function CopyEmail({ email, className = "" }: { email: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      data-cursor-label={copied ? "copied" : "copy"}
      className={`group inline-flex items-center gap-3 rounded-full border border-line bg-base/60 px-5 py-3 backdrop-blur transition-colors duration-(--dur-fast) hover:border-ember-soft ${className}`}
    >
      <span className="text-mono-data text-hi">{email}</span>
      <span className="text-mono-label relative inline-flex w-14 justify-end overflow-hidden text-lo">
        <span key={copied ? "ok" : "copy"} className={`anim-swap-in ${copied ? "text-ember" : "group-hover:text-md"}`}>
          {copied ? "ack ✓" : "copy"}
        </span>
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Email address copied to clipboard" : ""}
      </span>
    </button>
  );
}
