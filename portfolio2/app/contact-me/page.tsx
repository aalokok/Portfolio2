import Link from "next/link";
import { QuadrantShell } from "@/components/layout/quadrant-shell";

export default function ContactMePage() {
  return (
    <QuadrantShell
      topLeft={
        <div className="flex h-full flex-col justify-between gap-[18px]">
          <div className="space-y-[12px]">
            <p className="text-[12px] uppercase tracking-[0.08em] text-foreground/60">
              Navigation
            </p>
            <nav className="flex flex-col gap-[6px] text-[20px] leading-[24px]">
              <Link href="/" className="text-foreground/70 hover:text-foreground">
                Who am I
              </Link>
              <Link
                href="/creations-and-explorations"
                className="text-foreground/70 hover:text-foreground"
              >
                Creations and Explorations
              </Link>
              <Link href="/contact-me" className="font-semibold">
                Contact Me
              </Link>
            </nav>
          </div>
          <p className="text-[12px] leading-[18px] text-foreground/60">Reach out</p>
        </div>
      }
      topRight={
        <div className="space-y-[12px]">
          <h1 className="text-[30px] font-semibold leading-[36px] md:text-[36px] md:leading-[42px]">
            Contact Me
          </h1>
          <p className="max-w-[520px] text-[14px] leading-[18px] text-foreground/80 md:text-[16px] md:leading-[24px]">
            Let&apos;s collaborate. This quadrant can host email, socials, and booking links.
          </p>
        </div>
      }
      bottomLeft={
        <div className="space-y-[12px]">
          <div className="h-[18px] w-full rounded-sm bg-foreground/10" />
          <div className="h-[18px] w-full rounded-sm bg-foreground/10" />
          <div className="h-[18px] w-[70%] rounded-sm bg-foreground/10" />
        </div>
      }
      bottomRight={
        <div className="grid h-full min-h-[180px] grid-cols-2 gap-[12px]">
          <div className="rounded-sm bg-foreground/10" />
          <div className="rounded-sm bg-foreground/10" />
          <div className="rounded-sm bg-foreground/10" />
          <div className="rounded-sm bg-foreground/10" />
        </div>
      }
    />
  );
}
