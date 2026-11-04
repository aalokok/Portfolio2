"use client";

import React from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

type Item = { src: string; alt: string; caption: string };

// Ask Sanity's image CDN for a large, compressed version; leave other URLs alone.
function largeSrc(src: string) {
  return src.includes("cdn.sanity.io/images/") ? `${src}?w=2400&fit=max&auto=format&q=85` : src;
}

/**
 * Click any image inside to view it full screen, with arrows to step through every
 * image on the page. Images opt in through data-zoom-* attributes (see MediaFigure).
 * Renders with display: contents so it doesn't affect the surrounding layout.
 */
export function Lightbox({ children }: { children: React.ReactNode }) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [items, setItems] = React.useState<Item[]>([]);
  const [index, setIndex] = React.useState<number | null>(null);
  const open = index !== null;

  const onClick = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-zoom-src]");
    const root = rootRef.current;
    if (!target || !root || !root.contains(target)) return;
    // A link around an image should still behave like a link.
    if (target.closest("a")) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-zoom-src]"));
    setItems(
      nodes.map((n) => ({
        src: n.dataset.zoomSrc ?? "",
        alt: n.dataset.zoomAlt ?? "",
        caption: n.dataset.zoomCaption ?? "",
      })),
    );
    setIndex(nodes.indexOf(target));
  };

  const close = React.useCallback(() => setIndex(null), []);
  const step = React.useCallback(
    (d: number) => setIndex((i) => (i === null ? i : (i + d + items.length) % items.length)),
    [items.length],
  );

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, step]);

  const item = index !== null ? items[index] : null;
  const btn = "flex h-[40px] w-[40px] items-center justify-center text-foreground/60 transition-colors hover:text-primary";

  return (
    <div ref={rootRef} onClick={onClick} className="contents">
      {children}
      {item &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
            className="fixed inset-0 z-[200] flex flex-col bg-background/95 p-[16px] backdrop-blur-sm md:p-[30px]"
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div className="flex shrink-0 items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.08em] text-foreground/50 tabular-nums">
                {items.length > 1 ? `${(index ?? 0) + 1} / ${items.length}` : ""}
              </span>
              <button type="button" className={btn} onClick={close} aria-label="Close" autoFocus>
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>
            <div
              className="flex min-h-0 flex-1 items-center justify-center gap-[8px]"
              onClick={(e) => {
                if (e.target === e.currentTarget) close();
              }}
            >
              {items.length > 1 && (
                <button type="button" className={`${btn} hidden md:flex`} onClick={() => step(-1)} aria-label="Previous image">
                  <ArrowLeft className="h-[18px] w-[18px]" />
                </button>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={item.src}
                src={largeSrc(item.src)}
                alt={item.alt}
                className="max-h-full max-w-full animate-fade-in-fast object-contain"
              />
              {items.length > 1 && (
                <button type="button" className={`${btn} hidden md:flex`} onClick={() => step(1)} aria-label="Next image">
                  <ArrowRight className="h-[18px] w-[18px]" />
                </button>
              )}
            </div>
            <div className="flex min-h-[40px] shrink-0 items-center justify-between gap-[12px] pt-[10px]">
              {items.length > 1 ? (
                <button type="button" className={`${btn} md:invisible`} onClick={() => step(-1)} aria-label="Previous image">
                  <ArrowLeft className="h-[18px] w-[18px]" />
                </button>
              ) : (
                <span />
              )}
              <p className="text-center text-[12px] leading-[18px] text-foreground/60">{item.caption}</p>
              {items.length > 1 ? (
                <button type="button" className={`${btn} md:invisible`} onClick={() => step(1)} aria-label="Next image">
                  <ArrowRight className="h-[18px] w-[18px]" />
                </button>
              ) : (
                <span />
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
