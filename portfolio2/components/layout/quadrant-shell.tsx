import type { ReactNode } from "react";

type QuadrantShellProps = {
  topLeft: ReactNode;
  topRight: ReactNode;
  bottomLeft: ReactNode;
  bottomRight: ReactNode;
  topLeftClassName?: string;
  topRightClassName?: string;
  bottomLeftClassName?: string;
  bottomRightClassName?: string;
  /** Flex grow ratios for the left column [top, bottom]. Default [1, 1]. */
  leftRatio?: [number, number];
  /** Flex grow ratios for the right column [top, bottom]. Default [1, 1]. */
  rightRatio?: [number, number];
  /** On mobile, render the right column (visual content) above the left column (text). */
  mobileSwapColumns?: boolean;
  /** Drop the right column on mobile, for panes that only respond to hover. */
  hideRightOnMobile?: boolean;
};

/** Column widths shared by every page, so the nav keeps one width across the site. */
export const LEFT_COLUMN = 4;
export const RIGHT_COLUMN = 6;

// On desktop: fixed h-screen grid with per-section scroll.
// On mobile: natural-height stacking; the page (body) scrolls.
const sectionBase = "flex flex-col bg-background p-[24px] md:p-[30px] md:min-h-0";
const innerScroll  = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:min-h-0 md:flex-1";

export function QuadrantShell({
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  topLeftClassName    = "",
  topRightClassName   = "",
  bottomLeftClassName = "",
  bottomRightClassName = "",
  leftRatio    = [1, 1],
  rightRatio   = [1, 1],
  mobileSwapColumns = false,
  hideRightOnMobile = false,
}: QuadrantShellProps) {
  const leftOrder  = mobileSwapColumns ? "order-2 md:order-none" : "";
  const rightOrder = mobileSwapColumns ? "order-1 md:order-none" : "";

  return (
    <main className="flex flex-col bg-background pb-[calc(62px+env(safe-area-inset-bottom))] md:h-screen md:flex-row md:overflow-hidden md:pb-0">
      {/* Left column */}
      <div className={`flex flex-col md:min-h-0 md:min-w-0 ${leftOrder}`} style={{ flex: LEFT_COLUMN }}>
        {/* Nav — hidden on mobile (MobileSublinks sticky bar replaces it) */}
        <section className="hidden md:flex md:min-h-0 flex-col bg-background md:p-[30px]" style={{ flex: leftRatio[0] }}>
          <div className={`${innerScroll} ${topLeftClassName}`}>{topLeft}</div>
        </section>
        <section className={sectionBase} style={{ flex: leftRatio[1] }}>
          <div className={`${innerScroll} ${bottomLeftClassName}`}>{bottomLeft}</div>
        </section>
      </div>

      {/* Right column — gets a min-height on mobile so visual content (blobs, images) isn't 0-height */}
      <div className={`${hideRightOnMobile ? "hidden md:flex" : "flex"} flex-col md:min-h-0 md:min-w-0 ${rightOrder}`} style={{ flex: RIGHT_COLUMN }}>
        <section className={`${sectionBase} h-[55vw] md:h-auto`} style={{ flex: rightRatio[0] }}>
          <div className={`${innerScroll} h-full ${topRightClassName}`}>{topRight}</div>
        </section>
        <section className={sectionBase} style={{ flex: rightRatio[1] }}>
          <div className={`${innerScroll} ${bottomRightClassName}`}>{bottomRight}</div>
        </section>
      </div>
    </main>
  );
}
