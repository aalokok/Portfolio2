"use client";

import { useState } from "react";
import Link from "next/link";
import { Blobs } from "@/components/blobs";
import { GenerativePoem } from "@/components/wisdom/poem";

export function WisdomClient() {
  const [hue, setHue] = useState(0);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Full-screen blobs — non-interactive */}
      <Blobs className="absolute inset-0 h-full w-full" hueShift={hue} interactive={false} />

      {/* Close button */}
      <Link
        href="/"
        className="absolute left-[24px] top-[24px] z-20 flex h-[32px] w-[32px] items-center justify-center text-[18px] text-white mix-blend-difference transition-opacity hover:opacity-60 md:left-[30px] md:top-[30px]"
        aria-label="Close"
      >
        ×
      </Link>

      {/* Poem — centred, blends against the canvas backdrop */}
      <div className="absolute inset-0 z-10 flex items-center justify-center mix-blend-difference">
        <GenerativePoem />
      </div>

      {/* Hue slider */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center gap-[10px] pb-[30px]">
        <input
          type="range"
          min={0}
          max={360}
          value={hue}
          onChange={(e) => setHue(Number(e.target.value))}
          className="h-[3px] w-[200px] cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:h-[14px] [&::-webkit-slider-thumb]:w-[14px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(255,255,255,0.5)]"
          style={{
            background: `linear-gradient(to right,
              hsl(0,70%,55%), hsl(51,70%,55%), hsl(102,70%,55%),
              hsl(153,70%,55%), hsl(204,70%,55%), hsl(255,70%,55%),
              hsl(306,70%,55%), hsl(357,70%,55%))`,
          }}
        />
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/25">hue</p>
      </div>
    </main>
  );
}
