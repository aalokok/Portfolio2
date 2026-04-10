import Link from "next/link";
import { Ps2Blobs } from "@/components/ps2-blobs";
import { QuadrantShell } from "@/components/layout/quadrant-shell";

export default function Home() {
  return (
    <QuadrantShell leftRatio={[1, 1]} rightRatio={[7, 3]}
      topLeft={
        <div className="flex h-full flex-col justify-between gap-[18px]">
          <div className="space-y-[12px]">
            <p className="text-[12px] uppercase tracking-[0.08em] text-foreground/60">
              Navigation
            </p>
            <nav className="flex flex-col gap-[6px] text-[20px] leading-[24px]">
              <Link href="/" className="font-semibold">
                Who am I
              </Link>
              <Link
                href="/creations-and-explorations"
                className="text-foreground/70 hover:text-foreground"
              >
                Creations and Explorations
              </Link>
              <Link href="/contact-me" className="text-foreground/70 hover:text-foreground">
                Contact Me
              </Link>
            </nav>
          </div>
          <p className="text-[12px] leading-[18px] text-foreground/60">
            Identity and background
          </p>
        </div>
      }
      topRight={
        <Ps2Blobs className="h-full w-full" />
      }
      bottomLeft={
        <div className="h-full rounded-md bg-foreground/10 p-[12px]">
          <div className="h-full min-h-[140px] rounded-sm bg-foreground/10" />
        </div>
      }
      bottomRight={
        <div className="grid h-full grid-cols-3 grid-rows-3 gap-[12px]">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="rounded-sm bg-foreground/10" />
          ))}
        </div>
      }
    />
  );
}
