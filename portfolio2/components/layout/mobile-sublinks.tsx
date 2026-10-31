"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  DEFAULT_CATEGORY,
  INSPIRATION_HREF,
  PROJECT_CATEGORIES,
  categoryHref,
  isProjectCategory,
  type ProjectCategory,
} from "@/lib/projects";
import { projectNavDisplayTitle, type ProjectNavItem } from "./nav";

function MobileSublinksInner({
  projectNavItems,
  activeCategory,
}: {
  projectNavItems?: ProjectNavItem[];
  activeCategory?: ProjectCategory;
}) {
  const router = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const activeSection = searchParams.get("section") ?? "";
  const activeProject = Number(searchParams.get("project"));
  const isHome      = pathname === "/";
  const isWisdom    = pathname === "/wisdom";
  const isCreations = pathname.startsWith("/creations-and-explorations");
  const isInspiration = pathname === INSPIRATION_HREF;

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, searchParams]);

  type Item = { href: string; label: string; active: boolean };
  let items: Item[] = [];

  if (isHome || isWisdom) {
    items = [
      { href: "/?section=statement", label: "Statement",  active: isHome && activeSection === "statement" },
      { href: "/?section=biography",  label: "Biography",  active: isHome && activeSection === "biography" },
      { href: "/?section=experience", label: "Experience", active: isHome && activeSection === "experience" },
      { href: "/wisdom",              label: "visions",     active: isWisdom },
    ];
  } else if (isCreations) {
    // The categories and Inspiration, then the projects in the current category.
    const navItems = isInspiration ? [] : (projectNavItems ?? []);
    const categoryParam = searchParams.get("category");
    const currentCategory: ProjectCategory =
      activeCategory ?? (isProjectCategory(categoryParam) ? categoryParam : DEFAULT_CATEGORY);
    const onProject = navItems.some(({ order }) => order === activeProject);
    items = [
      ...PROJECT_CATEGORIES.map(({ value, label }) => ({
        href: categoryHref(value),
        label,
        active: !isInspiration && !onProject && value === currentCategory,
      })),
      { href: INSPIRATION_HREF, label: "Inspiration", active: isInspiration },
      ...navItems.map(({ order, title }) => ({
        href:   `/creations-and-explorations?project=${order}`,
        label:  projectNavDisplayTitle(title),
        active: activeProject === order,
      })),
    ];
  }

  if (!items.length) return null;
  const activeIndex = Math.max(0, items.findIndex((item) => item.active));
  const activeItem = items[activeIndex];
  const goPrev = () => {
    const prevIndex = (activeIndex - 1 + items.length) % items.length;
    router.push(items[prevIndex].href);
  };
  const goNext = () => {
    const nextIndex = (activeIndex + 1) % items.length;
    router.push(items[nextIndex].href);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 flex flex-col bg-background p-[24px] transition-opacity duration-200 md:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex items-center justify-between">
          <p
            className="leading-none text-foreground"
            style={{ fontFamily: "\"IntraNet\", sans-serif", fontWeight: 500, fontSize: 16 }}
          >
            Sublinks
          </p>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close sublinks menu"
            className="text-[28px] leading-none text-foreground transition-opacity hover:opacity-80"
          >
            ×
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-[28px] text-center">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`lowercase leading-none transition-opacity hover:opacity-80 ${item.active ? "text-foreground" : "text-foreground/70"}`}
              style={{ fontFamily: "\"IntraNet\", sans-serif", fontWeight: 500, fontSize: 18 }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="sticky top-0 z-30 h-[calc(56px+env(safe-area-inset-top))] bg-background pt-[env(safe-area-inset-top)] text-foreground md:hidden">
        <div className="flex h-[56px] items-center">
          <div className="flex min-w-0 flex-1 items-center justify-start px-[20px]">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="truncate text-left lowercase leading-none opacity-100"
              style={{ fontFamily: "\"IntraNet\", sans-serif", fontWeight: 500, fontSize: 12 }}
            >
              {activeItem.label}
            </button>
          </div>
          <div className="flex h-full shrink-0 border-l border-foreground/20">
            <button
              onClick={goPrev}
              aria-label="Previous sublink"
              className="flex h-full w-[56px] flex-col items-center justify-center border-r border-foreground/20 leading-none transition-opacity hover:opacity-80"
            >
              <span className="text-[18px]">←</span>
              <span className="mt-[2px] text-[9px] uppercase tracking-[0.08em] opacity-80">back</span>
            </button>
            <button
              onClick={goNext}
              aria-label="Next sublink"
              className="flex h-full w-[56px] flex-col items-center justify-center leading-none transition-opacity hover:opacity-80"
            >
              <span className="text-[18px]">→</span>
              <span className="mt-[2px] text-[9px] uppercase tracking-[0.08em] opacity-80">next</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function MobileSublinks({
  projectNavItems,
  activeCategory,
}: {
  projectNavItems?: ProjectNavItem[];
  activeCategory?: ProjectCategory;
}) {
  return (
    <Suspense fallback={null}>
      <MobileSublinksInner projectNavItems={projectNavItems} activeCategory={activeCategory} />
    </Suspense>
  );
}
