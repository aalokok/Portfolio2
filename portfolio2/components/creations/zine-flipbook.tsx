"use client";

import React from "react";
import { createPortal } from "react-dom";
import type { PageFlip } from "page-flip";
import { ArrowLeft, ArrowRight, Download, Maximize2, X } from "lucide-react";
import type { Zine } from "@/lib/zines";

type Props = Zine & { title: string };

type BookHandle = { next: () => void; prev: () => void };

type Layout = { pageW: number; pageH: number; spread: boolean };

// Book fits inside a box; prefer a two-page spread unless it would make pages much smaller.
function fitLayout(boxW: number, boxH: number, ratio: number): Layout | null {
  if (boxW < 40 || boxH < 40) return null;
  const singleH = Math.min(boxH, boxW / ratio);
  const spreadH = Math.min(boxH, boxW / (2 * ratio));
  const spread = spreadH >= singleH * 0.72;
  const pageH = Math.floor(spread ? spreadH : singleH);
  return { pageW: Math.floor(pageH * ratio), pageH, spread };
}

function useBoxSize<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [size, setSize] = React.useState<{ w: number; h: number } | null>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t: number | undefined;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize((s) => (s && Math.abs(s.w - r.width) < 2 && Math.abs(s.h - r.height) < 2 ? s : { w: r.width, h: r.height }));
    };
    measure();
    const ro = new ResizeObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(measure, 120);
    });
    ro.observe(el);
    return () => {
      window.clearTimeout(t);
      ro.disconnect();
    };
  }, []);
  return [ref, size] as const;
}

function pageLabel(index: number, count: number, spread: boolean) {
  // With a cover, spreads are 2–3, 4–5 … ; the covers stand alone.
  if (!spread || index === 0 || index >= count - 1) return `${index + 1}`;
  return `${index + 1}–${index + 2}`;
}

/** The book itself. Sizes to its parent box and rebuilds when that box changes size. */
const Book = React.forwardRef<
  BookHandle,
  {
    pages: string[];
    ratio: number;
    title: string;
    startPage: number;
    onPageChange: (index: number, spread: boolean) => void;
  }
>(function Book({ pages, ratio, title, startPage, onPageChange }, ref) {
  const [boxRef, box] = useBoxSize<HTMLDivElement>();
  const frameRef = React.useRef<HTMLDivElement>(null);
  const flipRef = React.useRef<PageFlip | null>(null);
  const pageRef = React.useRef(startPage);
  const onPageChangeRef = React.useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  const layout = box ? fitLayout(box.w, box.h, ratio) : null;

  React.useImperativeHandle(ref, () => ({
    next: () => flipRef.current?.flipNext(),
    prev: () => flipRef.current?.flipPrev(),
  }));

  React.useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !layout) return;
    let cancelled = false;

    // page-flip moves and finally removes the elements it is given, so it gets a host
    // element React never renders into.
    const host = document.createElement("div");
    frame.appendChild(host);

    const items = pages.map((src, i) => {
      const page = document.createElement("div");
      page.style.background = "#fff";
      page.style.overflow = "hidden";
      const img = document.createElement("img");
      // Set loading before src, otherwise the browser starts fetching every page at once.
      img.loading = Math.abs(i - pageRef.current) < 6 ? "eager" : "lazy";
      img.decoding = "async";
      img.alt = `${title}, page ${i + 1}`;
      img.src = src;
      img.draggable = false;
      img.style.cssText = "display:block;width:100%;height:100%;object-fit:cover;user-select:none;pointer-events:none";
      page.appendChild(img);
      return page;
    });

    const preloadAround = (i: number) => {
      for (let k = i; k < Math.min(pages.length, i + 5); k++) {
        const img = items[k]?.querySelector("img");
        if (img) img.loading = "eager";
      }
    };

    import("page-flip").then(({ PageFlip }) => {
      if (cancelled) return;
      const pf = new PageFlip(host, {
        size: "stretch",
        width: layout.pageW,
        height: layout.pageH,
        minWidth: layout.pageW,
        maxWidth: layout.pageW,
        minHeight: 40,
        maxHeight: layout.pageH,
        autoSize: true,
        usePortrait: true,
        showCover: true,
        startPage: Math.min(pageRef.current, pages.length - 1),
        maxShadowOpacity: 0.35,
        flippingTime: 700,
        mobileScrollSupport: true,
        showPageCorners: true,
      });
      pf.on<number>("flip", (e) => {
        pageRef.current = e.data;
        preloadAround(e.data);
        onPageChangeRef.current(e.data, pf.getOrientation() === "landscape");
      });
      pf.on("init", () => {
        if (cancelled) return;
        onPageChangeRef.current(pf.getCurrentPageIndex(), pf.getOrientation() === "landscape");
      });
      pf.loadFromHTML(items);
      flipRef.current = pf;
    });

    return () => {
      cancelled = true;
      try {
        flipRef.current?.destroy();
      } catch {
        // already torn down
      }
      flipRef.current = null;
      host.remove();
    };
    // Rebuild only when the fitted size or orientation changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout?.pageW, layout?.pageH, layout?.spread, pages, title]);

  return (
    // The frame is absolutely positioned so its pixel width never pushes the page layout wider.
    <div ref={boxRef} className="relative min-h-0 w-full min-w-0 flex-1 overflow-hidden">
      <div
        ref={frameRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={layout ? { width: layout.spread ? layout.pageW * 2 : layout.pageW, height: layout.pageH } : undefined}
      />
    </div>
  );
});

function Controls({
  index,
  count,
  spread,
  onPrev,
  onNext,
  children,
}: {
  index: number;
  count: number;
  spread: boolean;
  onPrev: () => void;
  onNext: () => void;
  children?: React.ReactNode;
}) {
  const btn =
    "flex h-[32px] w-[32px] items-center justify-center text-foreground/60 transition-colors hover:text-primary disabled:opacity-25 disabled:hover:text-foreground/60";
  const lastIndex = spread ? count - 2 : count - 1;
  return (
    <div className="flex w-full shrink-0 items-center justify-between gap-[12px] pt-[10px]">
      <div className="flex items-center gap-[4px]">
        <button type="button" className={btn} onClick={onPrev} disabled={index <= 0} aria-label="Previous page">
          <ArrowLeft className="h-[14px] w-[14px]" />
        </button>
        <span className="min-w-[64px] text-center text-[11px] uppercase tracking-[0.08em] text-foreground/50 tabular-nums" aria-live="polite">
          {pageLabel(index, count, spread)} / {count}
        </span>
        <button type="button" className={btn} onClick={onNext} disabled={index >= lastIndex} aria-label="Next page">
          <ArrowRight className="h-[14px] w-[14px]" />
        </button>
      </div>
      <div className="flex items-center gap-[14px] text-[11px] uppercase tracking-[0.08em]">{children}</div>
    </div>
  );
}

export function ZineFlipbook({ pages, pageWidth, pageHeight, pdf, title }: Props) {
  const ratio = pageWidth / pageHeight;
  const inlineBook = React.useRef<BookHandle>(null);
  const fullBook = React.useRef<BookHandle>(null);
  const [page, setPage] = React.useState(0);
  const [spread, setSpread] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [panelRef, panel] = useBoxSize<HTMLDivElement>();
  const [isPhone, setIsPhone] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsPhone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // On phones (or a very short desktop panel) an inline book is too small to read:
  // show the cover and open the full-screen reader instead.
  const compact = isPhone === true || (panel !== null && panel.h < 300);
  const ready = isPhone !== null && panel !== null;

  const onPageChange = React.useCallback((i: number, s: boolean) => {
    setPage(i);
    setSpread(s);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") fullBook.current?.next();
      if (e.key === "ArrowLeft") fullBook.current?.prev();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const linkCls = "flex items-center gap-[5px] text-foreground/50 transition-colors hover:text-primary";
  const pdfLink = pdf ? (
    <a href={pdf} target="_blank" rel="noopener noreferrer" className={linkCls}>
      <Download className="h-[12px] w-[12px]" /> PDF
    </a>
  ) : null;

  return (
    <div ref={panelRef} className="flex h-full w-full min-w-0 flex-col">
      {!ready ? null : compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex h-[60vw] max-h-[340px] w-full items-center justify-center gap-[20px] md:h-full md:max-h-none"
          aria-label={`Read ${title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pages[0]}
            alt={`${title} cover`}
            className="h-full w-auto bg-white object-contain shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
          />
          <span className="flex items-center gap-[6px] whitespace-nowrap text-[11px] uppercase tracking-[0.08em] text-primary">
            <Maximize2 className="h-[12px] w-[12px]" /> Read the zine
          </span>
        </button>
      ) : (
        <>
          <div
            className="flex min-h-0 min-w-0 flex-1 outline-none focus-visible:ring-1 focus-visible:ring-primary"
            tabIndex={0}
            aria-label={`${title} flipbook. Use the arrow keys to turn pages.`}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") { e.preventDefault(); inlineBook.current?.next(); }
              if (e.key === "ArrowLeft") { e.preventDefault(); inlineBook.current?.prev(); }
            }}
          >
            {!open && (
              <Book ref={inlineBook} pages={pages} ratio={ratio} title={title} startPage={page} onPageChange={onPageChange} />
            )}
          </div>
          <Controls
            index={page}
            count={pages.length}
            spread={spread}
            onPrev={() => inlineBook.current?.prev()}
            onNext={() => inlineBook.current?.next()}
          >
            <button type="button" onClick={() => setOpen(true)} className={linkCls}>
              <Maximize2 className="h-[12px] w-[12px]" /> Full screen
            </button>
            {pdfLink}
          </Controls>
        </>
      )}

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${title} zine`}
            className="fixed inset-0 z-[100] flex flex-col bg-background p-[16px] md:p-[30px]"
          >
            <div className="flex shrink-0 items-center justify-between pb-[10px]">
              <p className="text-[11px] uppercase tracking-[0.08em] text-foreground/50">{title}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-[32px] w-[32px] items-center justify-center text-foreground/60 hover:text-primary"
                aria-label="Close"
                autoFocus
              >
                <X className="h-[16px] w-[16px]" />
              </button>
            </div>
            <Book ref={fullBook} pages={pages} ratio={ratio} title={title} startPage={page} onPageChange={onPageChange} />
            <Controls
              index={page}
              count={pages.length}
              spread={spread}
              onPrev={() => fullBook.current?.prev()}
              onNext={() => fullBook.current?.next()}
            >
              {pdfLink}
            </Controls>
          </div>,
          document.body,
        )}
    </div>
  );
}
