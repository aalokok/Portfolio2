import type { ReactNode } from "react";
import { Nav, type ProjectNavItem } from "./nav";
import { MobileNav } from "./mobile-nav";
import { MobileSublinks } from "./mobile-sublinks";
import { QuadrantShell } from "./quadrant-shell";

type SiteShellBase = {
  topLeftClassName?: string;
  topRightClassName?: string;
  bottomLeftClassName?: string;
  bottomRightClassName?: string;
  leftRatio?: [number, number];
  rightRatio?: [number, number];
  columnRatio?: [number, number];
  projectNavItems?: ProjectNavItem[];
  /** On mobile, render the right column (visual content) above the left column (text). */
  mobileSwapColumns?: boolean;
};

type SiteShellSplit = SiteShellBase & {
  right?: never;
  topRight: ReactNode;
  bottomLeft: ReactNode;
  bottomRight: ReactNode;
};

type SiteShellMerged = SiteShellBase & {
  /** When provided, the right column is a single merged section. */
  right: ReactNode;
  topRight?: never;
  bottomLeft: ReactNode;
  bottomRight?: never;
};

type SiteShellProps = SiteShellSplit | SiteShellMerged;

// On desktop: fixed h-screen grid with per-section scroll.
// On mobile: natural-height stacking; the page (body) scrolls.
const sectionBase = "flex flex-col bg-background p-[24px] md:p-[30px] md:min-h-0";
const innerScroll  = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:min-h-0 md:flex-1";

export function SiteShell({
  topRight,
  bottomLeft,
  bottomRight,
  right,
  topLeftClassName,
  topRightClassName,
  bottomLeftClassName,
  bottomRightClassName,
  leftRatio,
  rightRatio,
  columnRatio,
  projectNavItems,
  mobileSwapColumns = false,
}: SiteShellProps) {
  const leftOrder  = mobileSwapColumns ? "order-2 md:order-none" : "";
  const rightOrder = mobileSwapColumns ? "order-1 md:order-none" : "";

  if (right !== undefined) {
    return (
      <>
        <MobileNav projectNavItems={projectNavItems} />
        <MobileSublinks projectNavItems={projectNavItems} />
        <main className="flex flex-col bg-background pb-[calc(62px+env(safe-area-inset-bottom))] md:h-screen md:flex-row md:overflow-hidden md:pb-0">
          {/* Left column */}
          <div className={`flex flex-col md:min-h-0 ${leftOrder}`} style={{ flex: columnRatio?.[0] ?? 1 }}>
            {/* Nav — hidden on mobile */}
            <section className="hidden md:flex md:min-h-0 flex-col bg-background md:p-[30px]" style={{ flex: leftRatio?.[0] ?? 1 }}>
              <div className={`${innerScroll} ${topLeftClassName ?? ""}`}>
                <Nav projectNavItems={projectNavItems} />
              </div>
            </section>
            <section className={sectionBase} style={{ flex: leftRatio?.[1] ?? 1 }}>
              <div className={`${innerScroll} ${bottomLeftClassName ?? ""}`}>
                {bottomLeft}
              </div>
            </section>
          </div>

          {/* Right column (merged) — min-height on mobile so blobs canvas isn't 0-height */}
          <div className={`flex flex-col md:min-h-0 ${rightOrder}`} style={{ flex: columnRatio?.[1] ?? 1 }}>
            <section className={`${sectionBase} h-[55vw] md:h-auto`} style={{ flex: 1 }}>
              <div className={`${innerScroll} h-full ${topRightClassName ?? ""}`}>
                {right}
              </div>
            </section>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <MobileNav projectNavItems={projectNavItems} />
      <MobileSublinks projectNavItems={projectNavItems} />
      <QuadrantShell
        topLeft={<Nav projectNavItems={projectNavItems} />}
        topRight={topRight}
        bottomLeft={bottomLeft}
        bottomRight={bottomRight}
        topLeftClassName={topLeftClassName}
        topRightClassName={topRightClassName}
        bottomLeftClassName={bottomLeftClassName}
        bottomRightClassName={bottomRightClassName}
        leftRatio={leftRatio}
        rightRatio={rightRatio}
        columnRatio={columnRatio}
        mobileSwapColumns={mobileSwapColumns}
      />
    </>
  );
}
