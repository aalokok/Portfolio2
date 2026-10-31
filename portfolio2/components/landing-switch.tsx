"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { ProjectCategory } from "@/lib/projects";

const WORDS: Record<ProjectCategory, string> = {
  "creative-technology": "technologist",
  design: "designer",
};

const DURATION = 1100; // ms
// Blur strength, scaled to the 16px text (the classic morph uses 8 at ~80px type).
// Too much blur and the threshold filter erases the letters instead of melting them.
const BLUR = 1.4;

// After a morph the soft "melted" look lingers, then slowly fades to plain text.
const SETTLE = 4000; // ms
const REST_BLUR = 0.6; // px, the softness right after a morph
const THRESHOLD = 60 / 255; // where the melt filter cuts faint pixels away

/**
 * Sets how strong the melt effect is on the word: 1 = full (during and right after a
 * morph), 0 = none (plain text). The filter eases toward doing nothing, so there's
 * no visible jump when it's finally removed.
 */
function setMelt(matrix: SVGFEColorMatrixElement | null, word: HTMLElement | null, amount: number) {
  const slope = Math.pow(255, amount);
  const offset = -(slope - 1) * THRESHOLD;
  matrix?.setAttribute(
    "values",
    `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${slope.toFixed(3)} ${offset.toFixed(3)}`,
  );
  if (word) {
    word.style.filter =
      amount <= 0 ? "none" : `url(#landing-morph-threshold) blur(${(REST_BLUR * amount).toFixed(3)}px)`;
  }
}

// Hover preview and the one-time nudge: a partial melt toward the other word, then back.
const PREVIEW_AMOUNT = 0.2; // how far the hover preview melts toward the other word
const NUDGE_AMOUNT = 0.5; // how far the one-time nudge goes
const NUDGE_DELAY = 4000; // ms of no interaction before the nudge
const NUDGE_KEY = "landing-morph-nudged"; // once per visit (sessionStorage)

const otherOf = (v: ProjectCategory): ProjectCategory => (v === "design" ? "creative-technology" : "design");

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// How blurred and faded a word is at progress p (0 = gone, 1 = fully there).
// Under the threshold filter below, the two blurred words melt into each other.
function morphStyle(el: HTMLElement | null, p: number) {
  if (!el) return;
  if (p >= 1) {
    el.style.filter = "";
    el.style.opacity = "1";
    return;
  }
  if (p <= 0) {
    el.style.filter = "";
    el.style.opacity = "0";
    return;
  }
  el.style.filter = `blur(${Math.min(BLUR / p - BLUR, 12)}px)`;
  el.style.opacity = `${Math.pow(p, 0.4) * 100}%`;
}

/**
 * Landing headline "I am a creative technologist / designer". Clicking or tapping it
 * morphs the last word into the other one and switches the copy below.
 * The choice is kept in the URL (?view=design) so a link can open on either side.
 */
export function LandingSwitch({
  initial,
  intro,
  panels,
}: {
  initial: ProjectCategory;
  intro?: ReactNode;
  panels: Record<ProjectCategory, ReactNode>;
}) {
  const [view, setView] = useState<ProjectCategory>(initial);
  // Which words the visitor has seen; seeing both fills both dots and shows the payoff line.
  const [seen, setSeen] = useState<ProjectCategory[]>([initial]);
  const metBoth = seen.length === 2;
  const refs = useRef<Partial<Record<ProjectCategory, HTMLSpanElement | null>>>({});
  const shown = useRef<ProjectCategory>(initial);
  const wordRef = useRef<HTMLSpanElement>(null);
  const matrixRef = useRef<SVGFEColorMatrixElement>(null);
  // How far the shown word is currently melted toward the other one (0 = not at all).
  const mix = useRef(0);
  const peekFrame = useRef(0);
  const morphing = useRef(false);
  const interacted = useRef(false);

  useEffect(() => {
    const from = shown.current;
    const to = view;
    shown.current = to;
    const outEl = refs.current[from] ?? null;
    const inEl = refs.current[to] ?? null;
    const word = wordRef.current;
    const matrix = matrixRef.current;
    if (from === to) {
      morphStyle(inEl, 1);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      morphStyle(outEl, 0);
      morphStyle(inEl, 1);
      setMelt(matrix, word, 0);
      return;
    }
    // Morph (full melt effect), then settle: the effect slowly fades to plain text.
    // If a hover preview had already started melting, carry on from there.
    cancelAnimationFrame(peekFrame.current);
    const start = mix.current;
    const morphTime = DURATION * (1 - start);
    morphing.current = true;
    setMelt(matrix, word, 1);
    let t0 = -1;
    let frame = 0;
    const tick = (now: number) => {
      if (t0 < 0) t0 = now;
      const t = now - t0;
      const p = morphTime > 0 ? start + (1 - start) * Math.min(t / morphTime, 1) : 1;
      morphStyle(outEl, 1 - p);
      morphStyle(inEl, p);
      if (p >= 1) mix.current = 0;
      const settle = Math.min(Math.max((t - morphTime) / SETTLE, 0), 1);
      setMelt(matrix, word, 1 - easeInOut(settle));
      if (settle < 1) frame = requestAnimationFrame(tick);
      // No hover previews until the post-morph softness has fully faded.
      else morphing.current = false;
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      morphStyle(outEl, 0);
      morphStyle(inEl, 1);
      setMelt(matrix, word, 0);
      mix.current = 0;
      morphing.current = false;
    };
  }, [view]);

  /** Melt the shown word partway toward the other one (target 0 = back to normal). */
  const peek = useCallback(
    (target: number, ms: number, then?: () => void) => {
      if (morphing.current) return;
      cancelAnimationFrame(peekFrame.current);
      const cur = refs.current[view] ?? null;
      const oth = refs.current[otherOf(view)] ?? null;
      const from = mix.current;
      let t0 = -1;
      const tick = (now: number) => {
        if (t0 < 0) t0 = now;
        const k = Math.min((now - t0) / ms, 1);
        const m = from + (target - from) * easeInOut(k);
        mix.current = m;
        morphStyle(cur, 1 - m);
        morphStyle(oth, m);
        // The melt filter fades in and out with the preview, so there's no snap at either end.
        setMelt(matrixRef.current, wordRef.current, Math.min(1, m * 4));
        if (k < 1) peekFrame.current = requestAnimationFrame(tick);
        else then?.();
      };
      peekFrame.current = requestAnimationFrame(tick);
    },
    [view],
  );

  useEffect(() => () => cancelAnimationFrame(peekFrame.current), []);

  // One nudge per visit: if nobody has touched the headline after a few seconds,
  // it melts halfway toward the other word and back. Skipped with reduced motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (sessionStorage.getItem(NUDGE_KEY)) return;
    } catch {
      // storage unavailable: still nudge once for this page view
    }
    const timer = window.setTimeout(() => {
      if (interacted.current || morphing.current) return;
      try {
        sessionStorage.setItem(NUDGE_KEY, "1");
      } catch {}
      peek(NUDGE_AMOUNT, 450, () => window.setTimeout(() => peek(0, 600), 150));
    }, NUDGE_DELAY);
    return () => window.clearTimeout(timer);
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    interacted.current = true;
    const next: ProjectCategory = view === "design" ? "creative-technology" : "design";
    setView(next);
    setSeen((s) => (s.includes(next) ? s : [...s, next]));
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    window.history.replaceState(null, "", url);
  };

  const other = view === "design" ? "creative technologist" : "creative designer";

  return (
    <div className="space-y-[20px]">
      {/* Threshold filter: turns the blurry overlap of the two words into a liquid morph. */}
      <svg aria-hidden className="absolute h-0 w-0">
        <defs>
          <filter id="landing-morph-threshold">
            <feColorMatrix
              ref={matrixRef}
              in="SourceGraphic"
              type="matrix"
              // Softer cut-off than the usual -140: at 16px the thin blurred strokes need it to stay visible.
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -60"
            />
          </filter>
        </defs>
      </svg>

      <button
        type="button"
        onClick={toggle}
        // Desktop hover: a faint preview of the other word melting in.
        onPointerEnter={(e) => {
          if (e.pointerType !== "mouse") return;
          interacted.current = true;
          peek(PREVIEW_AMOUNT, 250);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== "mouse") return;
          peek(0, 300);
        }}
        aria-label={`I am a creative ${WORDS[view]}. Switch to ${other}.`}
        className="group block cursor-pointer text-left outline-none focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        <span aria-hidden className="text-[16px] font-areal italic leading-[22px] text-foreground">
          I am a creative{" "}
          {/* Plain text at rest; the melt filter is switched on by setMelt() while morphing. */}
          <span ref={wordRef} className="relative inline-grid align-baseline text-primary" style={{ filter: "none" }}>
            {(Object.keys(WORDS) as ProjectCategory[]).map((key) => (
              <span
                key={key}
                ref={(el) => {
                  refs.current[key] = el;
                }}
                className="col-start-1 row-start-1 whitespace-nowrap"
                style={{ opacity: key === initial ? 1 : 0 }}
              >
                {WORDS[key]}
              </span>
            ))}
          </span>
        </span>
        {/* Carousel-style dots below the headline: the filled one is the word showing now. */}
        <span aria-hidden className="mt-[8px] flex items-center gap-[4px]">
          {(Object.keys(WORDS) as ProjectCategory[]).map((key) => (
            <span
              key={key}
              className={`h-[6px] w-[6px] rounded-full border border-primary transition-colors duration-500 ${
                key === view ? "bg-primary" : "bg-transparent"
              }`}
            />
          ))}
        </span>
      </button>

      {intro}

      {(Object.keys(WORDS) as ProjectCategory[]).map((value) => (
        <div
          key={value}
          role="region"
          aria-live="polite"
          aria-label={value === "design" ? "Design" : "Creative Technology"}
          hidden={view !== value}
          className="animate-fade-in-fast"
        >
          {panels[value]}
        </div>
      ))}

      {/* The payoff: appears once the visitor has seen both sides, then stays put. */}
      {metBoth && (
        <p className="animate-fade-in text-[13px] leading-[20px] text-foreground/60">
          you&apos;ve met both of me.{" "}
          <Link href="/contact-me" className="text-primary underline underline-offset-[3px] hover:no-underline">
            let&apos;s talk
          </Link>
        </p>
      )}
    </div>
  );
}
