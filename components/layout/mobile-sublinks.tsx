"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  DEFAULT_CATEGORY,
  PROJECT_CATEGORIES,
  categoryHref,
  isProjectCategory,
  type ProjectCategory,
} from "@/lib/projects";
import { scrollToHomeSection, useHomeScrollSpy } from "./home-scroll";
import { projectNavDisplayTitle, subLinkBarClass, type ProjectNavItem } from "./nav";

/**
 * Phone version of the green section bar under the desktop nav: the same links, always in view
 * at the top of the page. Projects aren't listed here; the page itself lists them.
 */
type BackLink = { href: string; label: string; title?: string };

/** True once the project heading has scrolled up under the pinned top bar. */
function useTitleTucked(enabled: boolean, barRef: React.RefObject<HTMLDivElement | null>, page: string) {
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // The phone copy of the heading: the desktop one is in the page too, but hidden.
      const heading = [...document.querySelectorAll<HTMLElement>("[data-project-title]")].find((el) => el.offsetParent);
      const bar = barRef.current;
      if (!heading || !bar) return;
      setTucked(heading.getBoundingClientRect().bottom <= bar.getBoundingClientRect().bottom);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      setTucked(false);
    };
  }, [enabled, barRef, page]);
  return tucked;
}

/** The pinned project name: as big as 14px, smaller when a long name would not fit beside the back link. */
function TuckedTitle({ title, shown }: { title: string; shown: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = "14px";
      const room = el.clientWidth;
      if (el.scrollWidth > room) el.style.fontSize = `${Math.max(9, (14 * room) / el.scrollWidth)}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [title]);
  return (
    <span
      ref={ref}
      aria-hidden
      className={`min-w-0 flex-1 overflow-hidden whitespace-nowrap text-right font-display-filled leading-[20px] text-foreground transition-[opacity,transform] duration-300 ease-out ${
        shown ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-[24px] opacity-0"
      }`}
    >
      {title}
    </span>
  );
}

function MobileSublinksInner({ activeCategory, backLink }: { activeCategory?: ProjectCategory; backLink?: BackLink }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const barRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tucked = useTitleTucked(!!backLink?.title, headerRef, searchParams.toString());
  const activeSection = searchParams.get("section") ?? "";
  const isHome = pathname === "/";
  const isWorks = pathname.startsWith("/works");
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
  } else if (isWorks) {
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
    <div
      ref={headerRef}
      className="sticky top-0 z-30 bg-background px-[24px] pb-[10px] pt-[calc(12px+env(safe-area-inset-top))] md:hidden"
    >
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
      {/* On a project: the way back stays in reach under the bar while the page scrolls. */}
      {backLink && (
        <div className="mt-[18px] flex items-center justify-between gap-[12px]">
          <Link
            href={backLink.href}
            className="block shrink-0 py-[4px] text-[13px] leading-[20px] text-foreground/80 transition-opacity active:opacity-60"
          >
            {backLink.label}
          </Link>
          {/* Once the big project name scrolls away, a small copy slides in here to keep its place. */}
          {backLink.title && <TuckedTitle title={projectNavDisplayTitle(backLink.title)} shown={tucked} />}
        </div>
      )}
    </div>
  );
}

export function MobileSublinks({
  activeCategory,
  backLink,
}: {
  /** Kept for the shell's call site; projects are no longer listed in this bar. */
  projectNavItems?: ProjectNavItem[];
  activeCategory?: ProjectCategory;
  backLink?: BackLink;
}) {
  return (
    <Suspense fallback={null}>
      <MobileSublinksInner activeCategory={activeCategory} backLink={backLink} />
    </Suspense>
  );
}
