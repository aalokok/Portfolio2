"use client";

import { GalleryHorizontal, LayoutGrid } from "lucide-react";
import { useCreationsView } from "./view-context";

export function ViewToggle() {
  const { view, setView } = useCreationsView();

  return (
    <div className="flex flex-row items-center gap-[clamp(4px,0.2rem+0.35vw,6px)]">
      <button
        onClick={() => setView("scroll")}
        title="Horizontal scroll"
        className={`transition-colors ${
          view === "scroll" ? "text-primary" : "text-foreground/40 hover:text-foreground/70"
        }`}
      >
        <GalleryHorizontal className="h-[clamp(12px,0.65rem+0.35vw,14px)] w-[clamp(12px,0.65rem+0.35vw,14px)]" />
      </button>
      <button
        onClick={() => setView("grid")}
        title="Grid"
        className={`transition-colors ${
          view === "grid" ? "text-primary" : "text-foreground/40 hover:text-foreground/70"
        }`}
      >
        <LayoutGrid className="h-[clamp(12px,0.65rem+0.35vw,14px)] w-[clamp(12px,0.65rem+0.35vw,14px)]" />
      </button>
    </div>
  );
}
