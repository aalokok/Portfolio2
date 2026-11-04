"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  DEFAULT_CATEGORY,
  INSPIRATION_HREF,
  PROJECT_CATEGORIES,
  categoryHref,
  isProjectCategory,
  type ProjectCategory,
} from "@/lib/projects";
import { scrollToHomeSection, useHomeScrollSpy } from "./home-scroll";
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
  useHomeScrollSpy("phone", isHome, activeSection, setInView);

  type Item = { href: string; label: string; active: boolean; section?: string };
  let items: Item[] = [];

  if (isHome) {
    items = [
      { section: "intro", href: "/", label: "Intro" },
      { section: "statement", href: "/?section=statement", label: "Statement" },
      { section: "biography", href: "/?section=biography", label: "Biography" },
      { section: "experience", href: "/?section=experience", label: "Experience" },
    ].map((item) => ({ ...item, active: item.section === inView }));
  } else if (isCreations && !isInspiration) {
    // A project page passes its own category; otherwise the URL decides.
    const categoryParam = searchParams.get("category");
    const currentCategory: ProjectCategory =
      activeCategory ?? (isProjectCategory(categoryParam) ? categoryParam : DEFAULT_CATEGORY);
    items = [
      ...PROJECT_CATEGORIES.map(({ value, label }) => ({
        href: categoryHref(value),
        label,
        active: value === currentCategory,
      })),
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
            onClick={item.section ? (e) => scrollToHomeSection(e, item.section!) : undefined}
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
