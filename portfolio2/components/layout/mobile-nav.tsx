"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import type { ProjectNavItem } from "./nav";

const mainLinks = [
  { href: "/",                           label: "About" },
  { href: "/creations-and-explorations", label: "Creations and Explorations" },
  { href: "/contact-me",                 label: "Reach Out" },
];

function MobileNavInner({ projectNavItems: _projectNavItems }: { projectNavItems?: ProjectNavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const isWisdom = pathname === "/wisdom";

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on navigation
  useEffect(() => { setOpen(false); }, [pathname, searchParams]);

  return (
    <>
      {/* Full-page overlay — main links only */}
      <div
        className={`fixed inset-0 z-40 flex flex-col bg-primary p-[24px] pb-[100px] transition-opacity duration-200 md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-[28px] text-center">
          {mainLinks.map(({ href, label }) => {
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="leading-none text-accent transition-opacity hover:opacity-80"
                style={{ fontFamily: '"IntraNet", sans-serif', fontWeight: 500, fontSize: 18 }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Circular toggle button — fixed bottom centre, mobile only */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        className="fixed bottom-0 left-0 right-0 z-50 h-[calc(62px+env(safe-area-inset-bottom))] bg-primary pb-[env(safe-area-inset-bottom)] text-accent transition-transform active:scale-[0.99] md:hidden"
      >
        <div className="flex h-[62px] items-center">
          <span
            className="flex-1 px-[20px] text-left leading-none"
            style={{ fontFamily: "\"IntraNet\", sans-serif", fontWeight: 500, fontSize: 24 }}
          >
            Aalok Sud
          </span>
          <span className="flex h-full w-[68px] items-center justify-center border-l border-accent/60 text-[20px]">
            {open ? "×" : "≡"}
          </span>
        </div>
      </button>
    </>
  );
}

export function MobileNav({ projectNavItems }: { projectNavItems?: ProjectNavItem[] }) {
  return (
    <Suspense fallback={null}>
      <MobileNavInner projectNavItems={projectNavItems} />
    </Suspense>
  );
}
