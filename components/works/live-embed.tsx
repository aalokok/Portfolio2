"use client";

import { useEffect, useRef } from "react";
import type { LiveEmbedTarget } from "@/lib/live-embeds";

/**
 * A same-site page in a frame sized to its content. On desktop it also scales down until the
 * whole page fits the height of the project pane, so it can be played without scrolling.
 * (It lays the page out wider and scales it back, so it still fills the pane's width.)
 */
export function LiveEmbed({ src, title }: LiveEmbedTarget) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const wrap = box.current;
    const el = frame.current;
    if (!wrap || !el) return;
    let pending = 0;
    let bodyObserver: ResizeObserver | null = null;

    const contentHeight = (width: number) => {
      const doc = el.contentDocument!;
      el.style.width = `${width}px`;
      el.style.height = "50px"; // a short frame, so scrollHeight is the content, not the frame
      return Math.ceil(doc.documentElement.scrollHeight);
    };

    const fit = () => {
      const doc = el.contentDocument;
      if (!doc?.body) return;
      const width = wrap.clientWidth;
      const pane = wrap.closest("article");
      const room = pane && window.matchMedia("(min-width: 768px)").matches ? pane.clientHeight : Infinity;
      let scale = 1;
      let height = contentHeight(width);
      if (height > room) {
        // Shrink until it fits: a smaller scale means a wider layout that is then shown smaller.
        let lo = 0.45;
        let hi = 1;
        for (let i = 0; i < 10; i++) {
          const mid = (lo + hi) / 2;
          if (contentHeight(width / mid) * mid <= room) lo = mid;
          else hi = mid;
        }
        scale = lo;
        height = contentHeight(width / scale);
      }
      el.style.width = `${width / scale}px`;
      el.style.height = `${height}px`;
      el.style.transform = scale < 1 ? `scale(${scale})` : "";
      wrap.style.height = `${Math.ceil(height * scale)}px`;
    };
    const soon = () => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(fit);
    };

    const onLoad = () => {
      bodyObserver?.disconnect();
      const body = el.contentDocument?.body;
      if (body) {
        bodyObserver = new ResizeObserver(soon);
        bodyObserver.observe(body);
      }
      fit();
    };
    const paneObserver = new ResizeObserver(soon);
    paneObserver.observe(wrap);
    const pane = wrap.closest("article");
    if (pane) paneObserver.observe(pane);
    el.addEventListener("load", onLoad);
    if (el.contentDocument?.readyState === "complete") onLoad();
    return () => {
      cancelAnimationFrame(pending);
      el.removeEventListener("load", onLoad);
      bodyObserver?.disconnect();
      paneObserver.disconnect();
    };
  }, [src]);

  return (
    <div ref={box} className="relative w-full flex-none overflow-hidden" style={{ height: 900 }}>
      <iframe
        ref={frame}
        src={src}
        title={title}
        allow="autoplay"
        className="absolute left-0 top-0 block w-full origin-top-left border-0"
        style={{ height: 900 }}
      />
    </div>
  );
}
