"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Blobs } from "@/components/blobs";
import { isVideo, LazyVideo } from "@/components/works/project-images";
import { PRIMARY_RGB } from "@/lib/blobs-shader";
import { useHomeView } from "@/lib/home-view";
import type { ProjectCategory, ProjectMedia } from "@/lib/projects";
import { isSanityImage, sanityImageUrl } from "@/lib/sanity-image";

export type FeaturedItem = {
  order: number;
  title: string;
  year?: number | null;
  oneLiner: string | null;
  tags: string[];
  images: ProjectMedia[];
};

type Mode = "orbs" | "featured";

// The well: where an orb is held to bring the featured work in. That orb then stays parked there.
const WELL = 64; // px across
const WELL_INSET = 28; // px from the panel's top and right edges
const CATCH = 52; // px from the well's center that counts as "in it"
const HOLD_MS = 2000; // how long to hold an orb there; the view changes over the whole hold
const DRAIN_MS = 900; // how long it takes to ease back if the orb leaves the well early
const PULL = 140; // px the parked orb has to be pulled out to go back to the orbs

type RGB = [number, number, number];
const BLACK: RGB = [0, 0, 0];
const PAGE: RGB = [245 / 255, 245 / 255, 245 / 255]; // the site background, #f5f5f5
const BRAND_GREEN: RGB = [188 / 255, 255 / 255, 164 / 255];

const mixRGB = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** A still for a card: the image itself, or a frame of a streamed video. */
function still(media: ProjectMedia | undefined, width: number) {
  if (!media) return null;
  if (media.playbackId) return `https://image.mux.com/${media.playbackId}/thumbnail.webp?width=${width}&time=0`;
  if (isSanityImage(media.url)) return sanityImageUrl(media.url, width);
  if (media.mimeType?.startsWith("video/") || /\.(mp4|webm|ogg|mov)$/i.test(media.url)) return null;
  return media.url;
}

/**
 * Desktop home, right side: the orbs, or the featured work for the side the headline shows
 * (technologist or designer). Carry an orb to the top right corner and hold it there: it turns
 * green and the panel slowly becomes the featured view, the frame fading to light with the orbs
 * faint and green behind the work. That orb stays parked in the corner; pull it back out to
 * return to the orbs.
 */
export function FeaturedPanel({
  initialView,
  featured,
}: {
  initialView: ProjectCategory;
  featured: Record<ProjectCategory, FeaturedItem[]>;
}) {
  const view = useHomeView(initialView);
  const [mode, setMode] = useState<Mode>("orbs");
  const showing = mode === "featured";
  const modeRef = useRef<Mode>("orbs"); // readable from the drag callback
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  const items = featured[view] ?? [];

  const wellRef = useRef<HTMLDivElement>(null);
  const [holding, setHolding] = useState(false); // an orb is in the hand
  const [progress, setProgress] = useState(0); // 0–1, how long it has been held in the well
  const [inside, setInside] = useState(false); // the carried orb is within the hold area
  const insideRef = useRef(false);
  const [pulled, setPulled] = useState(0); // 0–1, how far the parked orb has been pulled out
  const pulledRef = useRef(0);
  const [park, setPark] = useState<{ x: number; y: number } | null>(null);
  const point = useRef<{ x: number; y: number } | null>(null);
  const loop = useRef(0);
  const held = useRef(0); // progress, readable inside the loop

  const wellCenter = () => {
    const r = wellRef.current?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
  };

  // While an orb is held: build up when it is over the well, ease back when it is not.
  const run = useCallback(() => {
    cancelAnimationFrame(loop.current);
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const c = wellCenter();
      const at = point.current;
      const inWell = !!c && !!at && Math.hypot(at.x - c.x, at.y - c.y) < CATCH;
      if (inWell !== insideRef.current) {
        insideRef.current = inWell;
        setInside(inWell);
      }
      let p = inWell ? held.current + dt / HOLD_MS : held.current - dt / DRAIN_MS;
      if (p >= 1) {
        held.current = 0;
        setProgress(0);
        point.current = null; // the hold is over; the orb leaves the hand as it parks
        setPark(c); // the orb in hand settles into the corner
        setMode("featured");
        return;
      }
      p = Math.max(0, p);
      held.current = p;
      setProgress(p);
      if (at || p > 0) loop.current = requestAnimationFrame(tick);
    };
    loop.current = requestAnimationFrame(tick);
  }, []);

  const goBack = useCallback(() => {
    point.current = null;
    pulledRef.current = 0;
    setPulled(0);
    setPark(null);
    setMode("orbs");
  }, []);

  const onDrag = useCallback(
    (at: { x: number; y: number } | null) => {
      setHolding(!!at);
      if (modeRef.current === "featured") {
        point.current = null; // never carry a stale hold into the next visit to the orbs
        // Only the parked orb can be picked up here: how far is it from its corner?
        if (at) {
          const c = wellCenter();
          const k = c ? Math.min(Math.hypot(at.x - c.x, at.y - c.y) / PULL, 1) : 0;
          pulledRef.current = k;
          setPulled(k);
        } else if (pulledRef.current >= 1) {
          goBack();
        } else {
          pulledRef.current = 0;
          setPulled(0); // let go too soon: it settles back into the corner
        }
        return;
      }
      const started = !point.current && at;
      point.current = at;
      if (started) run();
    },
    [run, goBack],
  );

  useEffect(() => () => cancelAnimationFrame(loop.current), []);

  // Keep the parked orb in its corner if the window changes size.
  useEffect(() => {
    if (!showing) return;
    const onResize = () => setPark(wellCenter());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [showing]);

  // One number for how far into the featured view the panel is (0 = orbs, 1 = featured work).
  const blend = showing ? 1 - 0.6 * pulled : easeInOut(progress);
  // Driven frame by frame while holding or pulling; otherwise eased by CSS.
  const live = progress > 0 || pulled > 0;
  const ease = live ? "" : "transition-[filter,opacity] duration-[1200ms] ease-in-out";
  const carrying = holding && !showing;

  return (
    // select-none: dragging orbs would otherwise select text across the panel.
    // Not clipped: the hint sits just above the frame, in the page margin.
    <div className="relative h-full w-full select-none">
      {/* The orbs. Toward the featured view the frame fades to light and the orbs turn faint green. */}
      <div
        aria-hidden={showing}
        className={`absolute inset-0 ${ease}`}
        style={{ filter: `blur(${(1.5 * blend).toFixed(2)}px)`, opacity: 1 - 0.45 * blend }}
      >
        <Blobs
          className="h-full w-full"
          onDrag={onDrag}
          color={blend > 0 ? mixRGB(PRIMARY_RGB, BRAND_GREEN, blend) : undefined}
          background={blend > 0 ? mixRGB(BLACK, PAGE, blend) : undefined}
          heldGlow={showing ? 1 : easeInOut(progress)}
          park={showing ? park : null}
        />
      </div>

      {/* The well: only shows while an orb is carried, as a soft spot of light. */}
      <div ref={wellRef} aria-hidden className="pointer-events-none absolute z-10" style={{ top: WELL_INSET, right: WELL_INSET, width: WELL, height: WELL }}>
        {/* The hold area itself, drawn at its true size: a dashed hairline while the orb is
            outside, solid green once it is in and the hold is counting. */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-[opacity,border-color,background-color] duration-300"
          style={{
            width: CATCH * 2,
            height: CATCH * 2,
            opacity: carrying ? 1 : 0,
            borderStyle: inside ? "solid" : "dashed",
            borderColor: inside ? "rgba(188, 255, 164, 0.9)" : "rgba(255, 255, 255, 0.4)",
            backgroundColor: inside ? "rgba(188, 255, 164, 0.06)" : "transparent",
          }}
        />
        <div
          className="absolute inset-0 rounded-full transition-opacity duration-700"
          style={{
            opacity: carrying ? 1 : 0,
            background: `radial-gradient(circle, rgba(188, 255, 164, ${(0.1 + 0.25 * progress).toFixed(3)}) 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* The hint lives just above the frame, in the page margin, so it always sits on the same
          light background however the frame changes. Its letters fill with brand blue as you hold
          (or pull), which is the timer. Going in it only shows while an orb is in hand; coming
          back it is always there. */}
      <p
        aria-hidden
        className="pointer-events-none absolute right-0 whitespace-nowrap text-[11px] leading-[16px] transition-opacity duration-500"
        style={{ top: -21, opacity: showing || holding ? 1 : 0 }}
      >
        <FillText
          text={showing ? (pulled >= 1 ? "let go" : "pull the orb out to go back") : "hold it here"}
          fill={showing ? pulled : progress}
        />
      </p>

      {/* Ways in and out for keyboards. */}
      <button
        type="button"
        onClick={() => (showing ? goBack() : (setPark(wellCenter()), setMode("featured")))}
        className="sr-only focus:not-sr-only focus:absolute focus:bottom-[16px] focus:left-[16px] focus:z-20 focus:text-[12px] focus:text-primary"
      >
        {showing ? "back to the orbs" : "show featured work"}
      </button>

      {/* The work, rising in as the panel turns over: a wall of images that fits the panel. */}
      {(showing || blend > 0.01) && (
        <div
          aria-hidden={!showing}
          className={`absolute inset-0 flex flex-col p-[28px] ${ease} ${showing ? "" : "pointer-events-none"}`}
          style={{ opacity: showing ? 1 - 0.7 * pulled : blend * 0.9 }}
        >
          {/* Room for the parked orb in the corner, so the grid starts below it. */}
          <div className="h-[76px] shrink-0" />
          {/* Keyed by side, so switching the headline fades the new set in. */}
          <div key={view} className="min-h-0 flex-1 animate-fade-in">
            {items.length > 0 ? (
              <FeaturedGrid items={items} />
            ) : (
              <p className="text-[13px] text-foreground/50">nothing featured yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Grey text whose letters fill with brand blue, left to right, as `fill` goes 0 → 1. */
function FillText({ text, fill }: { text: string; fill: number }) {
  const at = (Math.min(Math.max(fill, 0), 1) * 100).toFixed(1);
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{ backgroundImage: `linear-gradient(to right, #0a33ff ${at}%, rgba(25, 25, 25, 0.45) ${at}%)` }}
    >
      {text}
    </span>
  );
}

type Tile = { item: FeaturedItem; media: ProjectMedia; src: string; ratio: number; alt: string };

const GAP_X = 8; // px between images in a row
const GAP_Y = 6; // px between rows
const CAPTION = 15; // px for the number under each image
const MAX_ROW = 280; // px: never taller than this, however few images there are

/** The tallest row height at which every tile fits the box, wrapping into rows like text. */
function fitRowHeight(ratios: number[], width: number, height: number) {
  const fits = (h: number) => {
    let rows = 1;
    let x = 0;
    for (const r of ratios) {
      const w = Math.floor(r * h);
      if (x > 0 && x + w > width) {
        rows++;
        x = 0;
      }
      x += w + GAP_X;
    }
    return rows * (h + CAPTION) + (rows - 1) * GAP_Y <= height;
  };
  let lo = 16;
  let hi = MAX_ROW;
  if (fits(hi)) return hi;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) lo = mid;
    else hi = mid;
  }
  return Math.floor(lo);
}

/**
 * Every image from the featured projects, at its own shape, in rows of one height. By default the
 * height is sized so the whole set fits its box (the desktop panel); with `rowHeight` the rows are
 * that tall and the grid simply runs as long as it needs (phones). A small running number sits
 * under each, and each image opens its project.
 */
function FeaturedGrid({ items, rowHeight, limit = 40 }: { items: FeaturedItem[]; rowHeight?: number; limit?: number }) {
  const tiles: Tile[] = items
    .flatMap((item) =>
      item.images.map((m) => {
        const src = still(m, 640);
        const d = m.dimensions;
        return src || isVideo(m)
          ? { item, media: m, src: src ?? "", ratio: d ? d.width / d.height : m.playbackId ? 16 / 9 : 4 / 3, alt: m.alt ?? item.title }
          : null;
      }),
    )
    .filter((t): t is Tile => !!t)
    .slice(0, limit);

  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const rowH = rowHeight ?? (box ? fitRowHeight(tiles.map((t) => t.ratio), box.w, box.h) : 0);

  return (
    <div ref={boxRef} className={rowHeight ? "w-full" : "h-full w-full overflow-hidden"}>
      {rowH > 0 && (
        <div className="flex flex-wrap content-start" style={{ columnGap: GAP_X, rowGap: GAP_Y }}>
          {tiles.map((t, i) => {
            return (
              <Link
                key={`${t.item.order}-${i}`}
                href={`/works?project=${t.item.order}`}
                className="flex flex-col outline-none focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-primary"
                style={{ width: Math.floor(t.ratio * rowH) }}
              >
                {isVideo(t.media) ? (
                  // Videos play as silent loops, like the works carousels.
                  <span className="relative block w-full overflow-hidden bg-foreground/5" style={{ height: rowH }}>
                    <LazyVideo src={t.media.url} playbackId={t.media.playbackId} className="absolute inset-0 h-full w-full object-cover" />
                  </span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.src} alt={t.alt} loading="lazy" className="block w-full bg-foreground/5 object-cover" style={{ height: rowH }} />
                )}
                <span className="mt-[3px] truncate text-[10px] leading-[12px] tabular-nums text-foreground/50">
                  {String(i + 1).padStart(4, "0")}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Phones: the same wall of featured images, without the orbs. Follows the headline's side
 * (technologist or designer); rows are a set height and the page just scrolls past them.
 */
export function FeaturedGallery({
  initialView,
  featured,
  rowHeight = 64,
  limit = 12,
}: {
  initialView: ProjectCategory;
  featured: Record<ProjectCategory, FeaturedItem[]>;
  rowHeight?: number;
  limit?: number;
}) {
  const view = useHomeView(initialView);
  const all = featured[view] ?? [];
  if (!all.length) return null;
  // Share the images out so every project on the side shows up, not just the first few.
  const each = Math.max(2, Math.floor(limit / all.length));
  const items = all.map((item) => ({ ...item, images: item.images.slice(0, each) }));
  // Keyed by side, so switching the headline fades the new set in.
  return (
    <div key={view} className="animate-fade-in">
      <FeaturedGrid items={items} rowHeight={rowHeight} />
    </div>
  );
}
