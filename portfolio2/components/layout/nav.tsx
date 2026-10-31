"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  DEFAULT_CATEGORY,
  INSPIRATION_HREF,
  PROJECT_CATEGORIES,
  categoryHref,
  isProjectCategory,
  type ProjectCategory,
} from "@/lib/projects";

const links = [
  { href: "/", label: "Aalok Sud" },
  { href: "/creations-and-explorations", label: "Creations and Explorations" },
  { href: "/contact-me", label: "Reach Out" },
];

// "" is the landing page itself, which has no section in its URL.
const homeSubLinks = [
  { section: "", label: "Intro" },
  { section: "statement", label: "Statement" },
  { section: "biography", label: "Biography" },
  { section: "experience", label: "Experience" },
];

export type ProjectNavItem = { order: number; title: string };

/** Short labels for nav where Sanity titles are too long for the layout. */
export function projectNavDisplayTitle(title: string): string {
  if (title.trim().toLowerCase() === "realtimeaudiometamorphosis") return "RAM";
  return title;
}

export const subLinkBarClass =
  "flex w-full min-h-[clamp(1.75rem,1.55rem+0.35vw,2rem)] items-stretch bg-accent lowercase px-0.5 text-[clamp(0.625rem,0.52rem+0.28vw,0.75rem)] leading-[clamp(1rem,0.9rem+0.25vw,1.125rem)] md:px-1";

export function subLinkItemClass(subActive: boolean) {
  return [
    "flex min-h-[clamp(1.75rem,1.55rem+0.35vw,2rem)] min-w-0 flex-1 items-center justify-center px-1.5 transition-colors md:px-2 lg:px-3",
    subActive ? "text-primary" : "text-foreground/65 hover:text-foreground",
  ].join(" ");
}

function NavInner({ activeCategory }: { activeCategory?: ProjectCategory }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section") ?? "";
  const isHome      = pathname === "/";
  const isCreations   = pathname.startsWith("/creations-and-explorations");
  const isInspiration = pathname === INSPIRATION_HREF;
  // A project page passes its own category; otherwise the URL decides.
  const categoryParam = searchParams.get("category");
  const currentCategory: ProjectCategory =
    activeCategory ?? (isProjectCategory(categoryParam) ? categoryParam : DEFAULT_CATEGORY);

  return (
    <div className="flex w-full flex-col items-stretch">
      <nav className="flex h-[clamp(2.75rem,2.35rem+1.1vw,3.5rem)] w-full flex-none items-stretch justify-between bg-primary lowercase px-0.5 text-[clamp(0.6875rem,0.58rem+0.32vw,0.9375rem)] leading-[clamp(1.125rem,1rem+0.35vw,1.5rem)] md:px-1">
        {links.map(({ href, label }) => {
          const isName = href === "/";
          const active = isName ? pathname === href : pathname.startsWith(href);

          const linkClasses = [
            "flex h-full min-w-0 items-center whitespace-nowrap px-2 transition-colors md:px-3 lg:px-4",
            isName
              ? `font-bold italic lowercase leading-none tracking-[-0.06em] text-[clamp(1.125rem,0.82rem+1.05vw,1.875rem)] ${active ? "text-accent" : "text-white/75 hover:text-white"}`
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

      {isHome && (
        <div className="animate-fade-in pt-[clamp(0.875rem,0.65rem+0.65vw,1.5rem)]">
          <div className={subLinkBarClass}>
            {homeSubLinks.map(({ section, label }) => (
              <Link
                key={label}
                href={section ? `/?section=${section}` : "/"}
                className={subLinkItemClass(activeSection === section)}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {isCreations && (
        <div className="animate-fade-in pt-[clamp(0.875rem,0.65rem+0.65vw,1.5rem)]">
          <div className={subLinkBarClass}>
            {PROJECT_CATEGORIES.map(({ value, label }) => {
              const subActive = !isInspiration && value === currentCategory;
              return (
                <Link
                  key={value}
                  href={categoryHref(value)}
                  aria-current={subActive ? "page" : undefined}
                  className={subLinkItemClass(subActive)}
                >
                  {label}
                </Link>
              );
            })}
            <Link
              href={INSPIRATION_HREF}
              aria-current={isInspiration ? "page" : undefined}
              className={subLinkItemClass(isInspiration)}
            >
              Inspiration
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

export function Nav({ activeCategory }: { activeCategory?: ProjectCategory } = {}) {
  return (
    <div className="hidden h-full w-full flex-col items-start justify-between md:flex">
      <Suspense fallback={<nav className="flex flex-col gap-[24px] text-[20px] leading-[24px]" />}>
        <NavInner activeCategory={activeCategory} />
      </Suspense>
    </div>
  );
}

