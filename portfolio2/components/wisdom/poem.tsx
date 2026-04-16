"use client";

import { useState, useEffect, useCallback } from "react";

// ── fragments ─────────────────────────────────────────────────────────────────
const FRAGMENTS = [
  "dont let desire become your ambition",
  "keep going wild horse",
  "head and heart go together",
  "some things are meant to be not known",
  "we must express we must exaggerate",
  "breaking rules but with grace",
  "but everything is a rule",
  "all horses are in fact the same",
  "there is only one horse",
  "abstraction beautifies us",
  "abstraction is a horse vision",
  "i wonder if they gallop at home",
  "why did my desire put me in unknown lands",
  "i've always only known how to gallop",
  "i've had no masters except my desire",
  "introspection cant be our purpose",
  "the sky is not chaotic it soothes the senses",
  "wisdom neighs the loudest",
  "horse of desire must not be followed",
  "we listen and we feel fleeting joy",
  "it never stays we must we must",
  "every horse bends to horse of senses",
  "horse of senses loves stimulation",
  "you are what this horse desires",
  "what i want but they hide it behind bigger words",
  "horse of desire rarely stops",
  "all horses are where they are because of desire",
  "we know what we want to know",
  "sometimes we must move",
  "horse of curiosity might ask why",
  "we found beauty in not knowing",
  "every horse knows what they are desire doesnt",
  "horse of philosophy keeps his distance",
  "we get what we want and we like getting what we want",
  "seeing hearing speaking tasting touching",
  "we love controlled overwhelmingness",
  "loud horse music",
  "high contrast flashing apples",
  "balance and chaos",
  "hello fruit of desire",
  "my dear dear dear apple",
  "take the apple and go",
  "next apple might be waiting",
  "red green golden all apples are lovely",
  "cider is what we want",
  "remixed things have new meaning",
];

const NOUNS = [
  "desire", "ambition", "apple", "senses", "vision", "chaos",
  "stimulation", "purpose", "introspection", "wisdom", "nostalgia",
  "abstraction", "beauty", "silence", "grace", "land", "home",
  "sky", "fruit", "heart", "pleasure", "determination", "remix",
  "balance", "contrast", "simulation", "gallop", "rule", "color",
];

const ADJECTIVES = [
  "wild", "unknown", "fleeting", "chaotic", "golden", "dead",
  "solemn", "silent", "controlled", "overwhelming", "abstract",
  "attainable", "conflicted", "young", "focused", "aligned",
  "lovely", "dear", "loud", "flashing",
];

const HORSES = [
  "horse of desire", "horse of wisdom", "horse of senses",
  "horse of nostalgia", "horse of change", "horse of curiosity",
  "horse of philosophy", "horse of happiness", "horse of independence",
];

const VERBS: { s: string; p: string }[] = [
  { s: "gallops",   p: "gallop" },
  { s: "drives",    p: "drive" },
  { s: "seeks",     p: "seek" },
  { s: "bends",     p: "bend" },
  { s: "hides",     p: "hide" },
  { s: "stays",     p: "stay" },
  { s: "moves",     p: "move" },
  { s: "knows",     p: "know" },
  { s: "creates",   p: "create" },
  { s: "desires",   p: "desire" },
  { s: "beautifies",p: "beautify" },
  { s: "questions", p: "question" },
  { s: "soothes",   p: "soothe" },
  { s: "speaks",    p: "speak" },
  { s: "listens",   p: "listen" },
  { s: "waits",     p: "wait" },
  { s: "remixes",   p: "remix" },
];

const PREPOSITIONS = [
  "through", "beyond", "from", "upon", "within",
  "against", "beneath", "across", "into", "among",
];

const CONNECTORS = ["but", "and", "yet", "so", "still"];

// ── helpers ───────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const FILL_TEMPLATES: (() => string)[] = [
  () => `${pick(HORSES)} ${pick(VERBS).s}`,
  () => {
    const subj = pick(["we", "you", "they", "i"]);
    return `${subj} ${pick(VERBS).p} ${pick(ADJECTIVES)} ${pick(NOUNS)}`;
  },
  () => `the ${pick(NOUNS)} ${pick(VERBS).s}`,
  () => `${pick(NOUNS)} ${pick(CONNECTORS)} ${pick(NOUNS)}`,
  () => `${pick(PREPOSITIONS)} the ${pick(ADJECTIVES)} ${pick(NOUNS)}`,
  () => `${pick(ADJECTIVES)} ${pick(NOUNS)}, ${pick(ADJECTIVES)} ${pick(NOUNS)}`,
  () => {
    const subj = pick(["we", "you", "they", "i"]);
    return `${subj} ${pick(VERBS).p} ${pick(PREPOSITIONS)} ${pick(NOUNS)}`;
  },
];

function countWords(str: string): number {
  return str.split(/\s+/).length;
}

function generatePoem(targetWords = 20): string[] {
  const usedFragments = new Set<string>();
  const lines: string[] = [];
  let totalWords = 0;

  while (totalWords < targetWords) {
    const useFragment = Math.random() < 0.6;
    let line: string;

    if (useFragment) {
      let attempts = 0;
      do {
        line = pick(FRAGMENTS);
        attempts++;
      } while (usedFragments.has(line) && attempts < 20);
      usedFragments.add(line);
    } else {
      line = pick(FILL_TEMPLATES)();
    }

    const lineWordCount = countWords(line);
    if (totalWords + lineWordCount > targetWords + 8) {
      line = `${pick(NOUNS)} ${pick(CONNECTORS)} ${pick(NOUNS)}`;
    }

    lines.push(line);
    totalWords += countWords(line);
  }

  return lines;
}

// ── component ─────────────────────────────────────────────────────────────────

export function GenerativePoem() {
  const [lines, setLines] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);

  const regenerate = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setLines(generatePoem(20));
      setKey((k) => k + 1);
      setTimeout(() => setVisible(true), 60);
    }, 300);
  }, []);

  useEffect(() => {
    setLines(generatePoem(20));
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      className="flex flex-col items-center justify-center px-8 py-16"
      style={{ color: "#ffffff" }}
    >
      <div
        key={key}
        className="max-w-[520px] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {lines.map((line, i) => (
          <p
            key={i}
            className="m-0 p-0 text-[14px] leading-[2] transition-[opacity,transform] duration-[600ms]"
            style={{
              transitionDelay: `${i * 140}ms`,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(6px)",
              fontFamily: "var(--font-inter-sans), Inter, sans-serif",
              fontStyle: "italic",
            }}
          >
            {line}
          </p>
        ))}
      </div>

      <button
        onClick={regenerate}
        className="mt-12 flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-full border border-white/40 bg-transparent text-[17px] transition-opacity duration-200 hover:opacity-60"
        aria-label="Generate new poem"
      >
        ↻
      </button>

      <p
        className="mt-4 opacity-40"
        style={{ fontFamily: '"IntraNet", sans-serif', fontWeight: 500, fontSize: 14 }}
      >
        HORSEVISION2026
      </p>
    </section>
  );
}
