import type { ReactNode } from "react";
import { Nav, type ProjectNavItem } from "./nav";
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

const baseSection = "min-h-0 flex-1 flex flex-col bg-background p-[24px] md:p-[30px]";
const innerScroll = "min-h-0 flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

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
}: SiteShellProps) {
  if (right !== undefined) {
    return (
      <main className="flex h-screen flex-col overflow-hidden bg-background md:flex-row">
        {/* Left column */}
        <div
          className="flex min-h-0 flex-col"
          style={{ flex: columnRatio?.[0] ?? 1 }}
        >
          <section className={baseSection} style={{ flex: leftRatio?.[0] ?? 1 }}>
            <div className={`${innerScroll} ${topLeftClassName ?? ""}`}>
              <Nav projectNavItems={projectNavItems} />
            </div>
          </section>
          <section className={baseSection} style={{ flex: leftRatio?.[1] ?? 1 }}>
            <div className={`${innerScroll} ${bottomLeftClassName ?? ""}`}>
              {bottomLeft}
            </div>
          </section>
        </div>

        {/* Right column — merged */}
        <div
          className="flex min-h-0 flex-col"
          style={{ flex: columnRatio?.[1] ?? 1 }}
        >
          <section className={baseSection} style={{ flex: 1 }}>
            <div className={`${innerScroll} ${topRightClassName ?? ""}`}>
              {right}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
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
    />
  );
}
