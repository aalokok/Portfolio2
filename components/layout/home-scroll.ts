"use client";

import { useEffect, type MouseEvent } from "react";

/**
 * The phone home page is one long page: every section stacked, and the section bar
 * follows along as it scrolls under a fixed orb frame.
 */
export const HOME_SECTIONS = ["intro", "statement", "biography", "experience"] as const;

export type HomeLayout = "phone" | "desktop";

const PHONE_QUERY = "(max-width: 767px)";

const layoutRoot = (layout: HomeLayout) => document.querySelector<HTMLElement>(`[data-home-root="${layout}"]`);

const sectionIn = (layout: HomeLayout, id: string) =>
  layoutRoot(layout)?.querySelector<HTMLElement>(`[data-home-section="${id}"]`) ?? null;

/** Glide to a home section instead of loading it as its own page. */
export function scrollToHomeSection(e: MouseEvent, id: string) {
  const layout: HomeLayout = window.matchMedia(PHONE_QUERY).matches ? "phone" : "desktop";
  const el = sectionIn(layout, id);
  if (!el) return; // not on the home page: follow the link as usual
  e.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Tracks which home section is in view as the page scrolls, and keeps the URL (?section=…)
 * in step so a reload or shared link opens at the same place.
 */
export function useHomeScrollSpy(
  layout: HomeLayout,
  isHome: boolean,
  initialSection: string,
  setInView: (id: string) => void,
) {
  useEffect(() => {
    // Both layouts are in the page, one of them hidden: only the visible one drives anything.
    const media = window.matchMedia(layout === "phone" ? PHONE_QUERY : "(min-width: 768px)");
    const root = layoutRoot(layout);
    if (!isHome || !root) return;
    // Phones scroll the window; desktop scrolls the left column (the root itself).
    const scroller: HTMLElement | Window = layout === "phone" ? window : root;

    let current = "";
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!media.matches) return;
      let line: number;
      let atBottom: boolean;
      if (layout === "phone") {
        // Just below the fixed orb frame.
        line = (document.querySelector("[data-home-frame]")?.getBoundingClientRect().bottom ?? 0) + 40;
        atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      } else {
        // The middle of the column: each section fills it, so this is the one being read.
        const box = root.getBoundingClientRect();
        line = box.top + box.height / 2;
        atBottom = root.scrollTop + root.clientHeight >= root.scrollHeight - 4;
      }
      // The last section whose top has passed the line is in view.
      let id: string = HOME_SECTIONS[0];
      for (const candidate of HOME_SECTIONS) {
        const el = sectionIn(layout, candidate);
        if (el && el.getBoundingClientRect().top <= line) id = candidate;
      }
      if (atBottom) id = HOME_SECTIONS[HOME_SECTIONS.length - 1];
      if (id === current) return;
      current = id;
      setInView(id);
      const url = new URL(window.location.href);
      if (id === "intro") url.searchParams.delete("section");
      else url.searchParams.set("section", id);
      window.history.replaceState(window.history.state, "", url);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    // Opened at a section (?section=…): start there. Waits two frames so it lands after
    // Next has scrolled the new page to the top; until then nothing is tracked.
    let start = requestAnimationFrame(() => {
      start = requestAnimationFrame(() => {
        if (media.matches && initialSection && initialSection !== "intro") {
          sectionIn(layout, initialSection)?.scrollIntoView({ block: "start" });
        }
        update();
        scroller.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
      });
    });
    return () => {
      cancelAnimationFrame(start);
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // Set up once per visit to the home page; later URL changes come from this hook itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHome, layout]);
}
