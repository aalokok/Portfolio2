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
  /** Flex grow ratio for left vs right columns. Default [1, 1]. */
  columnRatio?: [number, number];
};

const baseSection = "min-h-0 flex flex-col bg-background p-[24px] md:p-[30px]";
const innerScroll = "min-h-0 flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export function QuadrantShell({
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  topLeftClassName = "",
  topRightClassName = "",
  bottomLeftClassName = "",
  bottomRightClassName = "",
  leftRatio = [1, 1],
  rightRatio = [1, 1],
  columnRatio = [1, 1],
}: QuadrantShellProps) {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background md:flex-row">
      {/* Left column */}
      <div className="flex min-h-0 flex-col" style={{ flex: columnRatio[0] }}>
        <section className={baseSection} style={{ flex: leftRatio[0] }}>
          <div className={`${innerScroll} ${topLeftClassName}`}>{topLeft}</div>
        </section>
        <section className={baseSection} style={{ flex: leftRatio[1] }}>
          <div className={`${innerScroll} ${bottomLeftClassName}`}>{bottomLeft}</div>
        </section>
      </div>

      {/* Right column */}
      <div className="flex min-h-0 flex-col" style={{ flex: columnRatio[1] }}>
        <section className={baseSection} style={{ flex: rightRatio[0] }}>
          <div className={`${innerScroll} ${topRightClassName}`}>{topRight}</div>
        </section>
        <section className={baseSection} style={{ flex: rightRatio[1] }}>
          <div className={`${innerScroll} ${bottomRightClassName}`}>{bottomRight}</div>
        </section>
      </div>
    </main>
  );
}
