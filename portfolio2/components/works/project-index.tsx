"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { projectNavDisplayTitle } from "@/components/layout/nav";
import { MeltText, type MeltTextHandle } from "@/components/melt-text";
import type { ProjectMedia } from "@/lib/projects";
import { isSanityImage, sanityImageUrl } from "@/lib/sanity-image";
import { ProjectImages } from "./project-images";

export type ProjectIndexItem = {
  order: number;
  title: string;
  year?: number | null;
  oneLiner: string | null;
  tags: string[];
  /** What the top-right pane shows while this project is hovered. */
  previewImages: ProjectMedia[];
};

type IndexContextValue = {
  previewed: ProjectIndexItem | null;
  setPreviewed: (item: ProjectIndexItem) => void;
};

const IndexContext = createContext<IndexContextValue>({
  previewed: null,
  setPreviewed: () => {},
});

/** Shares the hovered project between the list and the two preview panes. Starts on the first project. */
export function ProjectIndexProvider({
  items,
  children,
}: {
  items: ProjectIndexItem[];
  children: React.ReactNode;
}) {
  const [previewed, setPreviewed] = useState<ProjectIndexItem | null>(items[0] ?? null);
  return (
    <IndexContext.Provider value={{ previewed, setPreviewed }}>
      {children}
    </IndexContext.Provider>
  );
}

/** A small still for a phone tile: the image itself, or a frame of a streamed video. */
function stillUrl(media: ProjectMedia) {
  if (media.playbackId) return `https://image.mux.com/${media.playbackId}/thumbnail.webp?width=300&time=0`;
  if (isSanityImage(media.url)) return sanityImageUrl(media.url, 300);
  return null; // a video with no streaming copy: no cheap still to show
}

/** Phone preview: up to six of the project's pieces in a grid of three, since there is no hover there. */
function MobileGrid({ item }: { item: ProjectIndexItem }) {
  const stills = item.previewImages.map(stillUrl).filter((src): src is string => !!src);
  // Whole rows only, so the grid never ends with a gap.
  const shown = stills.slice(0, stills.length >= 6 ? 6 : stills.length >= 3 ? 3 : stills.length);
  if (!shown.length) return null;
  return (
    <span className="mb-[16px] grid grid-cols-3 gap-[8px] md:hidden">
      {shown.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={src} alt="" loading="lazy" className="block aspect-square w-full bg-foreground/5 object-cover grayscale" />
      ))}
    </span>
  );
}

const HOVER_DELAY = 200; // ms the cursor has to rest on a row before the preview switches

export function ProjectList({ items }: { items: ProjectIndexItem[] }) {
  const { previewed, setPreviewed } = useContext(IndexContext);
  // Each name melts a little under the cursor and further when clicked.
  const melts = useRef(new Map<number, MeltTextHandle>());
  const peek = (order: number, target: number, ms: number) => melts.current.get(order)?.peek(target, ms);
  // The preview follows a row only once the cursor rests on it, so sweeping across other rows on
  // the way to the preview pane doesn't swap the project you were looking at.
  const hoverTimer = useRef(0);
  const previewSoon = (item: ProjectIndexItem) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setPreviewed(item), HOVER_DELAY);
  };
  const cancelPreview = () => window.clearTimeout(hoverTimer.current);
  useEffect(() => cancelPreview, []);

  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li key={item.order}>
          <Link
            href={`/works?project=${item.order}`}
            onMouseEnter={() => previewSoon(item)}
            onMouseLeave={cancelPreview}
            onFocus={() => setPreviewed(item)}
            onPointerEnter={(e) => e.pointerType === "mouse" && peek(item.order, 0.12, 250)}
            onPointerLeave={(e) => e.pointerType === "mouse" && peek(item.order, 0, 300)}
            onClick={() => peek(item.order, 0.6, 300)}
            title={projectNavDisplayTitle(item.title) !== item.title ? item.title : undefined}
            className={`block pb-[120px] transition-colors [overflow-wrap:anywhere] md:py-[10px] ${
              item.order === previewed?.order ? "md:text-primary" : "md:text-foreground/65 md:hover:text-foreground"
            }`}
          >
            {/* Phones get a card: a grid of the work first, since there is no hover preview there. */}
            <MobileGrid item={item} />
            <span className="flex items-baseline gap-[8px]">
              <span className="text-[22px] font-medium leading-[1] text-foreground font-display-outline md:text-[16px] md:font-normal md:lowercase md:leading-[22px] md:text-inherit md:[font-family:inherit]">
                <MeltText
                  ref={(handle) => {
                    if (handle) melts.current.set(item.order, handle);
                    else melts.current.delete(item.order);
                  }}
                  text={projectNavDisplayTitle(item.title)}
                />
              </span>
              {item.year && <span className="text-[11px] opacity-60">{item.year}</span>}
              {/* One clipped line, so showing tags never moves the rows under the cursor. */}
              <span
                className={`ml-[8px] hidden h-[22px] min-w-0 flex-1 flex-wrap justify-end gap-[6px] overflow-hidden transition-opacity duration-200 md:flex ${
                  item.order === previewed?.order ? "opacity-100" : "opacity-0"
                }`}
              >
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="h-[22px] whitespace-nowrap rounded-sm border border-foreground/15 px-[8px] text-[11px] leading-[20px] text-foreground/70"
                  >
                    {tag}
                  </span>
                ))}
              </span>
            </span>
            {/* No hover on touch screens, so the one-liner and tags sit in the card there. */}
            {item.oneLiner && (
              <span className="mt-[10px] block text-[13px] leading-[20px] text-foreground/80 md:hidden">
                {item.oneLiner}
              </span>
            )}
            {item.tags.length > 0 && (
              <span className="mt-[12px] flex flex-wrap gap-[6px] md:hidden">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-sm border border-foreground/15 px-[8px] py-[2px] text-[11px] text-foreground/70"
                  >
                    {tag}
                  </span>
                ))}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// The hover galleries dissolve at their sides and at the edge away from the text, so they read
// as a glimpse of the project rather than the whole thing.
const sideFade = "linear-gradient(to right, transparent, #000 14%, #000 86%, transparent)";
const dissolve = (towards: "top" | "bottom"): React.CSSProperties => {
  const mask = `${sideFade}, linear-gradient(to ${towards === "top" ? "bottom" : "top"}, transparent, #000 60%)`;
  return { maskImage: mask, WebkitMaskImage: mask, maskComposite: "intersect", WebkitMaskComposite: "source-in" };
};

/** The hovered project: gallery, text, then the same gallery drifting the other way. The whole pane opens it. */
export function ProjectPreview() {
  const { previewed } = useContext(IndexContext);
  if (!previewed) return null;
  const gallery = "h-[clamp(120px,24vh,240px)] flex-none animate-fade-in-fast opacity-80 transition-opacity duration-300 group-hover:opacity-100";
  return (
    <Link
      href={`/works?project=${previewed.order}`}
      className="group flex h-full flex-col justify-center gap-[28px] outline-none focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      {/* The galleries swap per project; the text stays put so the name can melt from one to the next. */}
      <div key={`top-${previewed.order}`} className={gallery} style={dissolve("top")}>
        <ProjectImages images={previewed.previewImages} title={previewed.title} />
      </div>
      <ProjectSummary item={previewed} hideTags />
      <div key={`bottom-${previewed.order}`} className={gallery} style={dissolve("bottom")}>
        <ProjectImages images={previewed.previewImages} title={previewed.title} reverse />
      </div>
    </Link>
  );
}

/** Name, one-liner, tags and year. Sits bottom right on the index, bottom left on a project. */
export function ProjectSummary({
  item,
  backLink = false,
  backHref = "/works",
  backLabel = "all projects",
  hideTags = false,
  children,
}: {
  item: ProjectIndexItem;
  backLink?: boolean;
  backHref?: string;
  backLabel?: string;
  /** For the hover view, where the list shows the tags instead. */
  hideTags?: boolean;
  /** Extra details shown under the tags. */
  children?: React.ReactNode;
}) {
  return (
    <div className="@container flex animate-fade-in-fast flex-col gap-[18px]">
      <h2 data-project-title className={`py-[0.2em] ${backLink ? "text-[length:min(6cqw,64px)]" : "text-[length:min(4.5cqw,46px)]"} font-medium leading-[1.1] text-foreground font-display-outline [overflow-wrap:anywhere]`}>
        {/* Melts from project to project in the hover view; plain on a project page. */}
        {backLink ? projectNavDisplayTitle(item.title) : <MeltText text={projectNavDisplayTitle(item.title)} strength={0.4} />}
      </h2>
      {/* Two lines reserved in the hover view, so gallery size holds steady between projects. */}
      <div className={`flex items-baseline justify-between gap-[16px] ${hideTags ? "min-h-[40px]" : ""}`}>
        {item.oneLiner && (
          <p className="text-[13px] leading-[20px] text-foreground/80">{item.oneLiner}</p>
        )}
        {hideTags && item.year && <span className="text-[13px] text-foreground/60">{item.year}</span>}
      </div>
      {!hideTags && (
        <div className="flex items-start justify-between gap-[16px]">
          <div className="flex flex-wrap gap-[6px]">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-sm border border-foreground/15 px-[8px] py-[2px] text-[11px] text-foreground/70"
              >
                {tag}
              </span>
            ))}
          </div>
          {item.year && <span className="text-[13px] text-foreground/60">{item.year}</span>}
        </div>
      )}
      {children && <div className="mt-[12px]">{children}</div>}
      {/* Desktop only: phones pin it under the top bar instead (see mobile-sublinks.tsx). */}
      {backLink && (
        <Link
          href={backHref}
          className="mt-[4px] hidden w-fit text-[13px] leading-[20px] text-foreground/80 transition-opacity hover:opacity-70 md:block"
        >
          {backLabel}
        </Link>
      )}
    </div>
  );
}
