"use client";

import { useEffect } from "react";

/**
 * Phone home: reports the intro text's height as --home-intro-h, so the orb frame above it can
 * take just the room left on the first screen and the whole intro fits without scrolling.
 */
export function HomeFrameFit() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-home-root="phone"]');
    // The text inside, not its section: the section is stretched to fill the screen, which would feed back.
    const intro = root?.querySelector<HTMLElement>('[data-home-section="intro"]')?.firstElementChild;
    if (!root || !(intro instanceof HTMLElement)) return;
    const observer = new ResizeObserver(() => {
      root.style.setProperty("--home-intro-h", `${intro.offsetHeight}px`);
    });
    observer.observe(intro);
    return () => observer.disconnect();
  }, []);
  return null;
}
