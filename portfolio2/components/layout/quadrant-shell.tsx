import type { ReactNode } from "react";

type QuadrantShellProps = {
  topLeft: ReactNode;
  topRight: ReactNode;
  bottomLeft: ReactNode;
  bottomRight: ReactNode;
  /** Flex grow ratios for the left column [top, bottom]. Default [1, 1]. */
  leftRatio?: [number, number];
  /** Flex grow ratios for the right column [top, bottom]. Default [1, 1]. */
  rightRatio?: [number, number];
};

export function QuadrantShell({
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  leftRatio = [1, 1],
  rightRatio = [1, 1],
}: QuadrantShellProps) {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background md:flex-row">
      {/* Left column */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-1">
        <section
          className="min-h-0 bg-background p-[24px] md:p-[30px]"
          style={{ flex: leftRatio[0] }}
        >
          {topLeft}
        </section>
        <section
          className="min-h-0 bg-background p-[24px] md:p-[30px]"
          style={{ flex: leftRatio[1] }}
        >
          {bottomLeft}
        </section>
      </div>

      {/* Right column */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-1">
        <section
          className="min-h-0 bg-background p-[24px] md:p-[30px]"
          style={{ flex: rightRatio[0] }}
        >
          {topRight}
        </section>
        <section
          className="min-h-0 bg-background p-[24px] md:p-[30px]"
          style={{ flex: rightRatio[1] }}
        >
          {bottomRight}
        </section>
      </div>
    </main>
  );
}
