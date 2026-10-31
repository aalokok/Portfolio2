"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createContext, useContext, useState } from "react";
import { projectNavDisplayTitle } from "@/components/layout/nav";
import type { ProjectMedia } from "@/lib/projects";
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

export function ProjectList({ items }: { items: ProjectIndexItem[] }) {
  const { previewed, setPreviewed } = useContext(IndexContext);

  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li key={item.order}>
          <Link
            href={`/creations-and-explorations?project=${item.order}`}
            onMouseEnter={() => setPreviewed(item)}
            onFocus={() => setPreviewed(item)}
            title={projectNavDisplayTitle(item.title) !== item.title ? item.title : undefined}
            className={`block py-[10px] transition-colors [overflow-wrap:anywhere] ${
              item.order === previewed?.order ? "text-primary" : "text-foreground/65 hover:text-foreground"
            }`}
          >
            <span className="flex items-baseline gap-[8px]">
              <span className="text-[16px] leading-[22px] lowercase">
                {projectNavDisplayTitle(item.title)}
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
            {/* No hover on touch screens, so the one-liner sits in the row there. */}
            {item.oneLiner && (
              <span className="mt-[2px] block text-[13px] leading-[20px] text-foreground/60 md:hidden">
                {item.oneLiner}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The hovered project: gallery, text, then the same gallery drifting the other way. */
export function ProjectPreview() {
  const { previewed } = useContext(IndexContext);
  if (!previewed) return null;
  return (
    <div key={previewed.order} className="flex h-full animate-fade-in-fast flex-col gap-[32px]">
      {/* The galleries split the height left by the text, so they fill the pane edge to edge. */}
      <div className="min-h-0 flex-1">
        <ProjectImages images={previewed.previewImages} title={previewed.title} />
      </div>
      <ProjectSummary item={previewed} hideTags />
      <div className="min-h-0 flex-1">
        <ProjectImages images={previewed.previewImages} title={previewed.title} reverse />
      </div>
    </div>
  );
}

/** Name, one-liner, tags and year. Sits bottom right on the index, bottom left on a project. */
export function ProjectSummary({
  item,
  backLink = false,
  backHref = "/creations-and-explorations",
  backLabel = "All projects",
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
      <h2 className="text-[length:min(12.5cqw,120px)] font-bold leading-[0.95] tracking-[-0.06em] text-foreground lowercase italic [overflow-wrap:anywhere]">
        {projectNavDisplayTitle(item.title)}
      </h2>
      {/* Two lines reserved in the hover view, so gallery size holds steady between projects. */}
      <div className={`flex items-baseline justify-between gap-[16px] ${hideTags ? "min-h-[48px]" : ""}`}>
        {item.oneLiner && (
          <p className="text-[16px] leading-[24px] text-foreground/80">{item.oneLiner}</p>
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
      {backLink && (
        <Link
          href={backHref}
          className="mt-[4px] flex w-fit items-center gap-[6px] text-[13px] leading-[20px] text-foreground/65 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-[14px] w-[14px]" />
          {backLabel}
        </Link>
      )}
    </div>
  );
}
