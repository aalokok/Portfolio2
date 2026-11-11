"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { projectNavDisplayTitle } from "@/components/layout/nav";
import { MeltText, type MeltTextHandle } from "@/components/melt-text";
import type { ProjectMedia } from "@/lib/projects";
import { isSanityImage, sanityImageUrl } from "@/lib/sanity-image";
import { isVideo, LazyVideo, ProjectImages } from "./project-images";

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

/** A small still: the image itself, or a frame of a streamed video. */
function stillUrl(media: ProjectMedia) {
  if (media.playbackId) return `https://image.mux.com/${media.playbackId}/thumbnail.webp?width=300&time=0`;
  if (isSanityImage(media.url)) return sanityImageUrl(media.url, 300);
  // A video with no streaming copy has no cheap still to show.
  if (media.mimeType?.startsWith("video/") || /\.(mp4|webm|ogg|mov)$/i.test(media.url)) return null;
  return media.url; // an image hosted on the site itself, like a zine's pages
}

/** Phones: three of the project's pieces in a row, under its name in the table. */
function RowGallery({ item }: { item: ProjectIndexItem }) {
  // Videos play as silent loops (streamed from Mux, started once on screen); images show as stills.
  const pieces = item.previewImages
    .map((media) => ({ media, still: stillUrl(media) }))
    .filter(({ media, still }) => isVideo(media) || !!still)
    .slice(0, 3);
  if (!pieces.length) return null;
  const tile = "block aspect-square w-full bg-foreground/5 object-cover";
  return (
    <span className="grid grid-cols-3 gap-[6px]">
      {pieces.map(({ media, still }, i) =>
        isVideo(media) ? (
          <span key={i} className="relative block aspect-square overflow-hidden bg-foreground/5">
            <LazyVideo src={media.url} playbackId={media.playbackId} className="absolute inset-0 h-full w-full object-cover" />
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={still!} alt="" loading="lazy" className={tile} />
        ),
      )}
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

  // A quiet table (number, project, tags, year), one hairline per row, at every size.
  const cols =
    "grid grid-cols-[22px_minmax(0,1fr)_minmax(0,1.1fr)_34px] items-baseline gap-x-[10px] md:grid-cols-[28px_minmax(0,1.1fr)_minmax(0,1.5fr)_40px] md:gap-x-[14px]";

  return (
    <div>
      <div className={`border-b border-foreground/10 pb-[6px] text-[11px] leading-[16px] text-foreground/40 ${cols}`}>
        <span>#</span>
        <span>project</span>
        <span>tags</span>
        <span className="text-right">year</span>
      </div>
      <ul className="flex flex-col">
        {items.map((item, i) => {
          const on = item.order === previewed?.order;
          return (
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
                className={`border-b border-foreground/10 py-[9px] text-[13px] leading-[20px] transition-colors md:py-[7px] ${cols} ${
                  on ? "md:bg-foreground/[0.035]" : "md:hover:bg-foreground/[0.025]"
                }`}
              >
                <span className={`tabular-nums text-foreground/40 transition-colors ${on ? "md:text-primary" : ""}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={`truncate lowercase text-foreground transition-colors ${on ? "md:text-primary" : ""}`}>
                  <MeltText
                    ref={(handle) => {
                      if (handle) melts.current.set(item.order, handle);
                      else melts.current.delete(item.order);
                    }}
                    text={projectNavDisplayTitle(item.title)}
                  />
                </span>
                <span className="truncate lowercase text-foreground/70">{item.tags.slice(0, 2).join(", ")}</span>
                <span className="text-right tabular-nums text-foreground/70">{item.year ?? ""}</span>
                {/* Phones have no preview pane: the tagline, then a glimpse of the work, sit in the row,
                    under the project name, keeping to the table's columns. */}
                <span className="col-span-3 col-start-2 mt-[8px] flex flex-col gap-[8px] md:hidden">
                  {item.oneLiner && (
                    <span className="line-clamp-2 text-[12px] leading-[18px] text-foreground/60">{item.oneLiner}</span>
                  )}
                  <RowGallery item={item} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The hovered project: gallery, text, then the same gallery drifting the other way. The whole pane opens it. */
export function ProjectPreview() {
  const { previewed } = useContext(IndexContext);
  if (!previewed) return null;
  const gallery = "h-[clamp(120px,calc(50vh-120px),420px)] flex-none animate-fade-in-fast opacity-80 transition-opacity duration-300 group-hover:opacity-100";
  return (
    <Link
      href={`/works?project=${previewed.order}`}
      className="group flex h-full flex-col justify-between gap-[28px] outline-none focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      {/* The galleries swap per project; the text stays put so the name can melt from one to the next. */}
      <div key={`top-${previewed.order}`} className={gallery}>
        <ProjectImages images={previewed.previewImages} title={previewed.title} />
      </div>
      <ProjectSummary item={previewed} hideTags />
      <div key={`bottom-${previewed.order}`} className={gallery}>
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
      {/* Desktop only, above the name: phones pin it under the top bar instead (see mobile-sublinks.tsx). */}
      {backLink && (
        <Link
          href={backHref}
          className="hidden w-fit text-[13px] leading-[20px] text-primary transition-opacity hover:opacity-70 md:block"
        >
          {backLabel}
        </Link>
      )}
      <h2 data-project-title className={`py-[0.2em] ${backLink ? "text-[length:min(6cqw,64px)]" : "text-[length:min(4.5cqw,46px)]"} font-medium leading-[1.1] text-foreground font-display-filled [overflow-wrap:anywhere]`}>
        {/* Melts from project to project in the hover view; plain on a project page. */}
        {backLink ? projectNavDisplayTitle(item.title) : <MeltText text={projectNavDisplayTitle(item.title)} strength={1} />}
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
    </div>
  );
}
