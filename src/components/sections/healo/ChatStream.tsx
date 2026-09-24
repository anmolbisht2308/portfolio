"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { healo } from "@/content/content";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { chatBus } from "./chat-bus";

type Phase = "idle" | "thinking" | "streaming" | "done";

const scenario = healo.chat.scenarios[0];

/** Split text into sub-word chunks that look like real model tokens. */
const tokenize = (text: string) => text.match(/\s*\S{1,4}/g) ?? [text];

/** Per-token delay: jittered, with natural pauses at punctuation. */
const tokenDelay = (tok: string) => {
  const base = 18 + Math.random() * 30;
  return /[.?!]$/.test(tok) ? base + 180 : /[,:;]$/.test(tok) ? base + 70 : base;
};

/**
 * Interactive mock of Healo's chat: the reply streams token-by-token, and
 * "Regenerate" re-requests and re-streams a different reply, which is exactly
 * the streaming + regeneration pipeline built for the real product.
 */
export default function ChatStream() {
  const reduced = useReducedMotion();
  const [sent, setSent] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [version, setVersion] = useState(0);
  const [text, setText] = useState("");
  const [tokens, setTokens] = useState(0);
  const [announce, setAnnounce] = useState("");

  const root = useRef<HTMLDivElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoStarted = useRef(false);

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const stream = useCallback(
    (v: number) => {
      cancel();
      const reply = scenario.replies[v];
      setVersion(v);
      setText("");
      setTokens(0);
      setAnnounce("");
      setPhase("thinking");
      chatBus.emit("request");

      const finish = (full: string) => {
        setPhase("done");
        setAnnounce(`Healo replied: ${full}`);
        chatBus.emit("done");
      };

      if (reduced) {
        setText(reply);
        finish(reply);
        return;
      }

      const toks = tokenize(reply);
      let i = 0;
      const next = () => {
        if (i >= toks.length) return finish(reply);
        const tok = toks[i++];
        setText((t) => t + tok);
        setTokens(i);
        chatBus.emit("token");
        timer.current = setTimeout(next, tokenDelay(tok));
      };
      // Time for the request packet to reach the model in the diagram.
      timer.current = setTimeout(() => {
        setPhase("streaming");
        next();
      }, 650);
    },
    [reduced],
  );

  const send = useCallback(() => {
    if (sent) return;
    setSent(true);
    timer.current = setTimeout(() => stream(0), reduced ? 0 : 350);
  }, [sent, stream, reduced]);

  const stop = () => {
    cancel();
    setPhase("done");
    setAnnounce("Response stopped.");
    chatBus.emit("done");
  };

  const regenerate = () => stream((version + 1) % scenario.replies.length);

  // Auto-send once the window is comfortably in view.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !autoStarted.current) {
          autoStarted.current = true;
          send();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [send]);

  // Keep the latest tokens in view (scrolls the log only, never the page).
  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [text, phase, sent]);

  useEffect(() => cancel, []);

  const busy = phase === "thinking" || phase === "streaming";

  return (
    <div
      ref={root}
      className="surface flex h-[30rem] flex-col overflow-hidden rounded-[20px] lg:h-[min(36rem,calc(100svh-10rem))]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line bg-surface/60 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-ember to-ember-soft font-display text-sm font-semibold text-void"
          >
            H
          </span>
          <div>
            <p className="font-display leading-tight font-semibold text-hi">{healo.chat.title}</p>
            <p className="text-mono-label flex items-center gap-1.5 text-lo">
              <span className="live-dot size-1.5!" aria-hidden="true" /> {healo.chat.status}
            </p>
          </div>
        </div>
        <p className="text-mono-data text-right text-lo" aria-hidden="true">
          {phase === "streaming" ? (
            <>
              <span className="text-signal">stream</span> · {tokens} tok
            </>
          ) : phase === "thinking" ? (
            <span className="text-ember">request →</span>
          ) : phase === "done" ? (
            <>
              v{version + 1}/{scenario.replies.length} · {tokens} tok
            </>
          ) : (
            "ws · open"
          )}
        </p>
      </div>

      {/* Messages */}
      <div
        ref={log}
        data-lenis-prevent
        role="log"
        aria-live="off"
        aria-label="Demo conversation"
        className="flex-1 space-y-4 overflow-y-auto px-5 py-5 [scrollbar-width:thin]"
      >
        <p className="text-mono-label text-center text-lo">{healo.chat.disclaimer}</p>
        {sent ? (
          <div
            key="user"
            className="anim-msg-in ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-raised px-4 py-3 text-hi"
          >
            {scenario.user}
          </div>
        ) : null}
        {phase !== "idle" ? (
          <div key="reply" className="anim-msg-in max-w-[92%]">
            {phase === "thinking" ? (
              <div
                className="typing flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-md border border-line px-4 py-4"
                aria-label="Healo is typing"
              >
                <span />
                <span />
                <span />
              </div>
            ) : (
              <p
                className={`rounded-2xl rounded-bl-md border border-line bg-base/40 px-4 py-3 leading-relaxed text-md ${
                  phase === "streaming" ? "caret" : ""
                }`}
              >
                {text}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {/* Composer / controls */}
      <div className="flex items-center gap-2 border-t border-line p-3">
        {!sent ? (
          <>
            <p className="flex-1 truncate px-2 text-sm text-md">{scenario.user}</p>
            <button
              type="button"
              onClick={send}
              className="rounded-full bg-ember px-4 py-2.5 text-sm font-medium text-void transition-colors hover:bg-ember-soft"
            >
              Send ↵
            </button>
          </>
        ) : (
          <>
            <p className="text-mono-data flex-1 px-2 text-lo">
              {busy ? "streaming over WebSocket…" : "try regenerating"}
            </p>
            {busy ? (
              <button
                type="button"
                onClick={stop}
                className="rounded-full border border-line px-4 py-2.5 text-sm text-hi transition-colors hover:border-ember-soft"
              >
                ■ Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={regenerate}
                data-cursor-label="re-stream"
                className="group inline-flex items-center gap-2 rounded-full bg-hi px-4 py-2.5 text-sm font-medium text-void transition-colors hover:bg-ember"
              >
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-(--dur-slow) ease-(--ease-signal) group-hover:-rotate-180"
                >
                  ↻
                </span>
                Regenerate
              </button>
            )}
          </>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
