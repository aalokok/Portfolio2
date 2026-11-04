"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type MouseEvent } from "react";
import {
  DEFAULT_CATEGORY,
  INSPIRATION_HREF,
  PROJECT_CATEGORIES,
  categoryHref,
  isProjectCategory,
  type ProjectCategory,
} from "@/lib/projects";
import { subLinkBarClass, type ProjectNavItem } from "./nav";

/**
 * Phone version of the green section bar under the desktop nav: the same links, always in view
 * at the top of the page. Projects aren't listed here; the page itself lists them.
 */
function MobileSublinksInner({ activeCategory }: { activeCategory?: ProjectCategory }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const barRef = useRef<HTMLDivElement>(null);
  const activeSection = searchParams.get("section") ?? "";
  const isHome = pathname === "/";
  const isCreations = pathname.startsWith("/creations-and-explorations");
  const isInspiration = pathname === INSPIRATION_HREF;
  // On the phone home page every section is on one long page; this is the one in view.
  const [inView, setInView] = useState(activeSection || "intro");
  useHomeScrollSpy(isHome, activeSection, setInView);

  type Item = { href: string; label: string; active: boolean; section?: string };
  let items: Item[] = [];

  if (isHome) {
    items = [
      { section: "intro", href: "/", label: "Intro" },
      { section: "statement", href: "/?section=statement", label: "Statement" },
      { section: "biography", href: "/?section=biography", label: "Biography" },
      { section: "experience", href: "/?section=experience", label: "Experience" },
    ].map((item) => ({ ...item, active: item.section === inView }));
  } else if (isCreations) {
    // A project page passes its own category; otherwise the URL decides.
    const categoryParam = searchParams.get("category");
    const currentCategory: ProjectCategory =
      activeCategory ?? (isProjectCategory(categoryParam) ? categoryParam : DEFAULT_CATEGORY);
    items = [
      ...PROJECT_CATEGORIES.map(({ value, label }) => ({
        href: categoryHref(value),
        label,
        active: !isInspiration && value === currentCategory,
      })),
      { href: INSPIRATION_HREF, label: "Inspiration", active: isInspiration },
    ];
  }

  // On narrow phones the bar can scroll sideways: keep the current link in view.
  useEffect(() => {
    barRef.current?.querySelector<HTMLElement>("[aria-current=page]")?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [pathname, searchParams, inView]);

  if (!items.length) return null;

  return (
    <div className="sticky top-0 z-30 bg-background px-[24px] pb-[10px] pt-[calc(12px+env(safe-area-inset-top))] md:hidden">
      <div
        ref={barRef}
        className={`${subLinkBarClass} overflow-x-auto text-[12px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={item.section ? (e) => scrollToSection(e, item.section!) : undefined}
            aria-current={item.active ? "page" : undefined}
            // Grows to share the bar like desktop, but never squeezes below its text.
            className={`flex min-h-[36px] shrink-0 grow basis-auto items-center justify-center whitespace-nowrap px-[12px] transition-colors ${
              item.active ? "text-primary" : "text-foreground/65"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

const sectionEl = (id: string) => document.querySelector<HTMLElement>(`[data-home-section="${id}"]`);

/** Glide to a section on the phone home page instead of loading it as its own page. */
function scrollToSection(e: MouseEvent, id: string) {
  const el = sectionEl(id);
  if (!el) return; // not the one-page layout (desktop): follow the link as usual
  e.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Tracks which home section is under the orb frame as the page scrolls, and keeps the
 * URL (?section=…) in step so a reload or shared link opens at the same place.
 */
function useHomeScrollSpy(isHome: boolean, initialSection: string, setInView: (id: string) => void) {
  useEffect(() => {
    // Phones only: on desktop the one-page layout is in the page but hidden, and must not drive anything.
    const phone = window.matchMedia("(max-width: 767px)");
    if (!isHome || !sectionEl("intro")) return;
    const ids = ["intro", "statement", "biography", "experience"];

    let current = "";
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!phone.matches) return;
      // The line just below the fixed orb frame: the last section whose top has passed it is in view.
      const line = (document.querySelector("[data-home-frame]")?.getBoundingClientRect().bottom ?? 0) + 40;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let id = ids[0];
      for (const candidate of ids) {
        const el = sectionEl(candidate);
        if (el && el.getBoundingClientRect().top <= line) id = candidate;
      }
      if (atBottom) id = ids[ids.length - 1];
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
        if (phone.matches && initialSection && initialSection !== "intro") sectionEl(initialSection)?.scrollIntoView({ block: "start" });
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
      });
    });
    return () => {
      cancelAnimationFrame(start);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // Set up once per visit to the home page; later URL changes come from this hook itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHome]);
}

export function MobileSublinks({
  activeCategory,
}: {
  /** Kept for the shell's call site; projects are no longer listed in this bar. */
  projectNavItems?: ProjectNavItem[];
  activeCategory?: ProjectCategory;
}) {
  return (
    <Suspense fallback={null}>
      <MobileSublinksInner activeCategory={activeCategory} />
    </Suspense>
  );
}
