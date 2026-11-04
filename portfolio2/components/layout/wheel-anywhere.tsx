"use client";

import { useEffect } from "react";

const canScroll = (el: Element, dy: number) => {
  const { overflowY } = getComputedStyle(el);
  if (overflowY !== "auto" && overflowY !== "scroll") return false;
  return dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0;
};

/** The biggest panel on the page that can still scroll this way: the page's main content. */
function mainScroller(dy: number) {
  let best: HTMLElement | null = null;
  let bestArea = 0;
  for (const el of document.querySelectorAll<HTMLElement>('main [class*="overflow-y-auto"]')) {
    const area = el.clientWidth * el.clientHeight;
    if (area > bestArea && canScroll(el, dy)) {
      best = el;
      bestArea = area;
    }
  }
  return best;
}

/**
 * Desktop panels scroll on their own, so the wheel only works over the one that scrolls.
 * This lets it work anywhere: a wheel over something that can't scroll (the orbs, the nav)
 * scrolls the page's main panel instead.
 */
export function WheelAnywhere() {
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const onWheel = (e: WheelEvent) => {
      // Galleries and pinch-zoom handle their own wheel.
      if (e.defaultPrevented || e.ctrlKey || !desktop.matches) return;
      const dy = e.deltaY;
      if (!dy || Math.abs(e.deltaX) > Math.abs(dy)) return;
      // Over a panel that can scroll this way: let it scroll as usual.
      for (let n = e.target instanceof Element ? e.target : null; n; n = n.parentElement) {
        if (canScroll(n, dy)) return;
      }
      const target = mainScroller(dy);
      if (!target) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? target.clientHeight : 1;
      target.scrollTop += dy * unit;
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);
  return null;
}
