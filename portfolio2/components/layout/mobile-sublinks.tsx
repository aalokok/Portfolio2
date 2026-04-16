"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { ProjectNavItem } from "./nav";

function MobileSublinksInner({ projectNavItems }: { projectNavItems?: ProjectNavItem[] }) {
  const router = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section") ?? "";
  const activeProject = Number(searchParams.get("project") ?? "1");
  const isHome      = pathname === "/";
  const isWisdom    = pathname === "/wisdom";
  const isCreations = pathname === "/creations-and-explorations";

  type Item = { href: string; label: string; active: boolean };
  let items: Item[] = [];

  if (isHome || isWisdom) {
    items = [
      { href: "/",                   label: "Statement",  active: isHome && activeSection === "" },
      { href: "/?section=biography",  label: "Biography",  active: isHome && activeSection === "biography" },
      { href: "/?section=experience", label: "Experience", active: isHome && activeSection === "experience" },
      { href: "/wisdom",              label: "visions",     active: isWisdom },
    ];
  } else if (isCreations) {
    const navItems = projectNavItems
      ?? Array.from({ length: 10 }, (_, i) => ({ order: i + 1, title: String(i + 1).padStart(2, "0") }));
    items = navItems.map(({ order, title }) => ({
      href:   `/creations-and-explorations?project=${order}`,
      label:  title,
      active: activeProject === order,
    }));
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
    <div className="sticky top-0 z-30 flex h-[calc(56px+env(safe-area-inset-top))] items-end bg-background pt-[env(safe-area-inset-top)] text-foreground md:hidden">
      <div className="flex min-w-0 flex-1 items-center justify-start px-[20px]">
        <Link
          href={activeItem.href}
          className="truncate text-left leading-none opacity-100"
          style={{ fontFamily: "\"IntraNet_Outline\", sans-serif", fontWeight: 500, fontSize: 12 }}
        >
          {activeItem.label}
        </Link>
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
  );
}

export function MobileSublinks({ projectNavItems }: { projectNavItems?: ProjectNavItem[] }) {
  return (
    <Suspense fallback={null}>
      <MobileSublinksInner projectNavItems={projectNavItems} />
    </Suspense>
  );
}
