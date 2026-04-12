"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ViewToggle } from "@/components/creations/view-toggle";

const links = [
  { href: "/", label: "Aalok Sud" },
  { href: "/creations-and-explorations", label: "Creations and Explorations" },
  { href: "/contact-me", label: "Reach Out" },
];

const homeSubLinks = [
  { section: "biography", label: "Biography" },
  { section: "experience", label: "Experience" },
];

export type ProjectNavItem = { order: number; title: string };

const fallbackCreationsSubLinks = Array.from({ length: 10 }, (_, i) => ({
  project: i + 1,
  label: String(i + 1).padStart(2, "0"),
}));

function NavInner({ projectNavItems }: { projectNavItems?: ProjectNavItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section") ?? "biography";
  const activeProject = Number(searchParams.get("project") ?? "1");
  const isHome = pathname === "/";
  const isCreations = pathname === "/creations-and-explorations";

  return (
    <nav className="flex flex-row items-baseline gap-[24px] text-[15px] leading-[24px]">
      {links.map(({ href, label }) => {
        const active = pathname === href;
        const isName = href === "/";

        return (
          <div key={href} className="relative">
            <Link
              href={href}
              className={
                isName
                  ? active
                    ? " text-primary "
                    : "text-foreground/70 hover:text-foreground"
                  : active
                    ? "text-primary"
                    : "text-foreground/70 hover:text-foreground"
              }
              style={
                isName
                  ? {
                      fontFamily: '"IntraNet_Outline", sans-serif',
                      fontWeight: 500,
                      fontSize: 15,
                      lineHeight: "24px",
                    }
                  : undefined
              }
            >
              {label}
            </Link>

            {isName && isHome && (
              <div className="animate-fade-in absolute top-full left-0 flex flex-row gap-[18px] pt-[4px]">
                {homeSubLinks.map(({ section, label: subLabel }) => {
                  const subActive = activeSection === section;
                  return (
                    <Link
                      key={section}
                      href={`/?section=${section}`}
                      className={`text-[12px] leading-[18px] transition-colors ${
                        subActive
                          ? "text-primary"
                          : "text-foreground/50 hover:text-foreground/80"
                      }`}
                    >
                      {subLabel}
                    </Link>
                  );
                })}
              </div>
            )}

            {isName && isCreations && (
              <div className="animate-fade-in absolute top-full left-0 flex flex-row gap-[14px] pt-[4px]">
                {(projectNavItems ?? fallbackCreationsSubLinks.map((s) => ({ order: s.project, title: s.label }))).map(({ order, title }) => {
                  const subActive = activeProject === order;
                  return (
                    <Link
                      key={order}
                      href={`/creations-and-explorations?project=${order}`}
                      className={`text-[12px] leading-[18px] transition-colors ${
                        subActive
                          ? "text-primary"
                          : "text-foreground/50 hover:text-foreground/80"
                      }`}
                    >
                      {title}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {isCreations && <ViewToggle />}
    </nav>
  );
}

export function Nav({ projectNavItems }: { projectNavItems?: ProjectNavItem[] }) {
  return (
    <Suspense fallback={<nav className="flex flex-col gap-[24px] text-[20px] leading-[24px]" />}>
      <NavInner projectNavItems={projectNavItems} />
    </Suspense>
  );
}
