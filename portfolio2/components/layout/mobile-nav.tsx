"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import type { ProjectNavItem } from "./nav";

const mainLinks = [
  { href: "/", label: "about" },
  { href: "/creations-and-explorations", label: "creations and explorations" },
  { href: "/contact-me", label: "reach out" },
];

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

// Pills in the site background colour; the hairline edge keeps them visible on the page.
const pill = "border border-foreground/15 bg-background";

function MobileNavInner() {
  const [open, setOpen] = useState(false);
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  // Close on navigation
  useEffect(() => { setOpen(false); }, [pathname, searchParams]);

  // Close with Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      {/* Tapping anywhere outside the menu closes it. */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-foreground/10 transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <nav
        aria-label="Main"
        className="fixed inset-x-[16px] bottom-[calc(16px+env(safe-area-inset-bottom))] z-50 flex flex-col items-end gap-[8px]"
      >
        {/* The menu: one pill per page, rising out of the button below. */}
        <ul id="mobile-menu" className="flex flex-col items-end gap-[8px]" hidden={!open}>
          {mainLinks.map(({ href, label }, i) => {
            const active = isActive(pathname, href);
            return (
              <li
                key={href}
                className="animate-pill-in"
                // Bottom pill first, so the menu unfolds upward from the button.
                style={{ animationDelay: `${(mainLinks.length - 1 - i) * 40}ms` }}
              >
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`${pill} block rounded-[6px] px-[14px] py-[6px] text-[13px] leading-none ${
                    active ? "text-primary" : "text-foreground"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Name on the left (goes home), menu button on the right. */}
        <div className="flex w-full items-center justify-between">
          <Link
            href="/"
            className={`${pill} inline-flex h-[30px] items-center rounded-[6px] px-[12px] text-[17px] font-bold italic leading-none tracking-[-0.04em] text-foreground transition-transform active:scale-95`}
          >
            aalok sud
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className={`${pill} inline-flex h-[24px] items-center rounded-[6px] px-[10px] text-[11px] leading-none text-foreground/80 transition-transform active:scale-95`}
          >
            {open ? "close" : "menu"}
          </button>
        </div>
      </nav>
    </div>
  );
}

export function MobileNav(_props: { projectNavItems?: ProjectNavItem[] }) {
  return (
    <Suspense fallback={null}>
      <MobileNavInner />
    </Suspense>
  );
}
