"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const query = "(max-width: 767px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * Mounts its children on phone-width screens only. For heavy pieces like the orbs' WebGL
 * canvas, which would otherwise keep running hidden on desktop.
 */
export function MobileOnly({ children }: { children: ReactNode }) {
  const mobile = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
  return mobile ? children : null;
}
