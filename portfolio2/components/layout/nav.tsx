"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useLayoutEffect, useRef, useState } from "react";
import { ViewToggle } from "@/components/creations/view-toggle";

const links = [
  { href: "/", label: "Aalok Sud" },
  { href: "/creations-and-explorations", label: "Creations and Explorations" },
  { href: "/contact-me", label: "Reach Out" },
];

type SubLink =
  | { kind: "section"; section: string; label: string }
  | { kind: "page"; href: string; label: string };

const homeSubLinks: SubLink[] = [
  { kind: "section", section: "statement",  label: "Statement" },
  { kind: "section", section: "biography",  label: "Biography" },
  { kind: "section", section: "experience", label: "Experience" },
  { kind: "page",    href: "/wisdom",       label: "Visions" },
];

export type ProjectNavItem = { order: number; title: string };

/** Short labels for nav where Sanity titles are too long for the layout. */
export function projectNavDisplayTitle(title: string): string {
  if (title.trim().toLowerCase() === "realtimeaudiometamorphosis") return "RAM";
  return title;
}

const fallbackCreationsSubLinks = Array.from({ length: 10 }, (_, i) => ({
  project: i + 1,
  label: String(i + 1).padStart(2, "0"),
}));

const subLinkBarClass =
  "flex w-full min-h-[clamp(1.75rem,1.55rem+0.35vw,2rem)] items-stretch bg-accent px-0.5 text-[clamp(0.625rem,0.52rem+0.28vw,0.75rem)] leading-[clamp(1rem,0.9rem+0.25vw,1.125rem)] md:px-1";

function subLinkItemClass(subActive: boolean) {
  return [
    "flex min-h-[clamp(1.75rem,1.55rem+0.35vw,2rem)] min-w-0 flex-1 items-center justify-center px-1.5 transition-colors md:px-2 lg:px-3",
    subActive ? "text-primary" : "text-foreground/65 hover:text-foreground",
  ].join(" ");
}

function creationsGridLinkClass(subActive: boolean) {
  return [
    "flex min-h-[clamp(1.75rem,1.55rem+0.35vw,2rem)] min-w-0 items-center justify-center whitespace-normal px-0.5 py-0.5 text-center text-[clamp(0.5625rem,0.48rem+0.22vw,0.75rem)] leading-snug transition-colors [overflow-wrap:anywhere] md:py-1",
    subActive ? "text-primary" : "text-foreground/65 hover:text-foreground",
  ].join(" ");
}

function NavInner({ projectNavItems }: { projectNavItems?: ProjectNavItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section") ?? "";
  const activeProject = Number(searchParams.get("project") ?? "1");
  const isHome      = pathname === "/";
  const isWisdom    = pathname === "/wisdom";
  const isCreations = pathname === "/creations-and-explorations";

  const navRef = useRef<HTMLElement>(null);
  const [stackWidth, setStackWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const node = navRef.current;
      if (!node) return;
      /**
       * When locked, nav is `w-full` inside a fixed-width stack. `max-w-full` on the nav caps
       * its width to that parent, so `width: max-content` alone still measures no wider than the
       * old stackWidth — growing the viewport never increases the reading. Override max-width
       * for the probe, then clear inline styles so Tailwind classes apply again.
       */
      node.style.setProperty("width", "max-content", "important");
      node.style.setProperty("max-width", "none", "important");
      const w = Math.round(node.getBoundingClientRect().width);
      node.style.removeProperty("width");
      node.style.removeProperty("max-width");
      setStackWidth(w);
    };

    let rafId = 0;
    const scheduleMeasure = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => measure());
    };

    measure();
    window.addEventListener("resize", scheduleMeasure);
    window.visualViewport?.addEventListener("resize", scheduleMeasure);
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) scheduleMeasure();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", scheduleMeasure);
      window.visualViewport?.removeEventListener("resize", scheduleMeasure);
    };
  }, [pathname]);

  /** Until measured, omit sublinks so they cannot widen the column and stretch the primary bar (`w-full` nav). */
  const sublinksReady = stackWidth != null;
  const navWidthLocked = stackWidth != null;

  return (
    <div
      className="flex max-w-full flex-none flex-col items-stretch"
      style={navWidthLocked ? { width: stackWidth } : { width: "max-content" }}
    >
      <nav
        ref={navRef}
        className={`flex h-[clamp(2.75rem,2.35rem+1.1vw,3.5rem)] max-w-full flex-none items-stretch bg-primary px-0.5 text-[clamp(0.6875rem,0.58rem+0.32vw,0.9375rem)] leading-[clamp(1.125rem,1rem+0.35vw,1.5rem)] md:px-1 ${navWidthLocked ? "w-full" : "w-fit"}`}
      >
        {links.map(({ href, label }) => {
          const active = pathname === href;
          const isName = href === "/";

          const linkClasses = [
            "flex h-full min-w-0 items-center whitespace-nowrap px-2 transition-colors md:px-3 lg:px-4",
            isName
              ? `font-medium leading-none text-[clamp(1.125rem,0.82rem+1.05vw,1.875rem)] [font-family:IntraNet,sans-serif] ${active ? "text-accent" : "text-white/75 hover:text-white"}`
              : active
                ? "text-accent"
                : "text-white/75 hover:text-white",
          ].join(" ");

          return (
            <div key={href} className="flex min-w-0 items-stretch">
              <Link href={href} className={linkClasses}>
                {label}
              </Link>
            </div>
          );
        })}
      </nav>

      {(isHome || isWisdom) && sublinksReady && (
        <div className="animate-fade-in pt-[clamp(0.875rem,0.65rem+0.65vw,1.5rem)]">
          <div className={subLinkBarClass}>
            {homeSubLinks.map((sub) => {
              const subHref   = sub.kind === "section" ? `/?section=${sub.section}` : sub.href;
              const subActive = sub.kind === "section"
                ? isHome && activeSection === sub.section
                : isWisdom;
              return (
                <Link
                  key={subHref}
                  href={subHref}
                  className={subLinkItemClass(subActive)}
                >
                  {sub.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {isCreations && sublinksReady && (
        <div className="animate-fade-in pt-[clamp(0.875rem,0.65rem+0.65vw,1.5rem)]">
          <div className="grid w-full min-w-0 grid-cols-4 gap-x-[clamp(0.125rem,0.08rem+0.2vw,0.25rem)] gap-y-[clamp(0.125rem,0.08rem+0.15vw,0.25rem)] bg-accent p-[clamp(0.25rem,0.15rem+0.25vw,0.375rem)]">
            {(projectNavItems ?? fallbackCreationsSubLinks.map((s) => ({ order: s.project, title: s.label }))).map(
              ({ order, title }) => {
                const subActive = activeProject === order;
                const label = projectNavDisplayTitle(title);
                return (
                  <Link
                    key={order}
                    href={`/creations-and-explorations?project=${order}`}
                    className={creationsGridLinkClass(subActive)}
                    title={title !== label ? title : undefined}
                  >
                    {label}
                  </Link>
                );
              },
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Nav({ projectNavItems }: { projectNavItems?: ProjectNavItem[] }) {
  return (
    <div className="hidden h-full w-max max-w-full flex-col items-start justify-between md:flex">
      <Suspense fallback={<nav className="flex flex-col gap-[24px] text-[20px] leading-[24px]" />}>
        <NavInner projectNavItems={projectNavItems} />
      </Suspense>
      <Suspense>
        <NavViewToggle />
      </Suspense>
    </div>
  );
}

function NavViewToggle() {
  const pathname = usePathname();
  if (pathname !== "/creations-and-explorations") return null;
  return <ViewToggle />;
}
