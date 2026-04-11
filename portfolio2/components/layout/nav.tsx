"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const links = [
  { href: "/", label: "Aalok Sud" },
  { href: "/creations-and-explorations", label: "Creations and Explorations" },
  { href: "/contact-me", label: "Reach Out" },
];

const homeSubLinks = [
  { section: "biography", label: "Biography" },
  { section: "experience", label: "Experience" },
];

function NavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section") ?? "biography";
  const isHome = pathname === "/";

  return (
    <nav className="flex flex-row gap-[24px] text-[15px] leading-[24px]">
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
          </div>
        );
      })}
    </nav>
  );
}

export function Nav() {
  return (
    <Suspense fallback={<nav className="flex flex-col gap-[24px] text-[20px] leading-[24px]" />}>
      <NavInner />
    </Suspense>
  );
}
