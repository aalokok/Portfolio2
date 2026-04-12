"use client";

import { GalleryHorizontal, LayoutGrid } from "lucide-react";
import { useCreationsView } from "./view-context";

export function ViewToggle() {
  const { view, setView } = useCreationsView();

  return (
    <div className="flex flex-row items-center gap-[6px]">
      <button
        onClick={() => setView("scroll")}
        title="Horizontal scroll"
        className={`transition-colors ${
          view === "scroll" ? "text-primary" : "text-foreground/40 hover:text-foreground/70"
        }`}
      >
        <GalleryHorizontal size={14} />
      </button>
      <button
        onClick={() => setView("grid")}
        title="Grid"
        className={`transition-colors ${
          view === "grid" ? "text-primary" : "text-foreground/40 hover:text-foreground/70"
        }`}
      >
        <LayoutGrid size={14} />
      </button>
    </div>
  );
}
