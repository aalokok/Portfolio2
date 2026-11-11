"use client";

import { useSyncExternalStore } from "react";
import type { ProjectCategory } from "@/lib/projects";

// Which side of the home page is showing (technologist or designer). The headline switch
// sets it; the featured work panel on the right follows it.
let current: ProjectCategory | null = null;
const listeners = new Set<() => void>();

export function setHomeView(view: ProjectCategory) {
  if (view === current) return;
  current = view;
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** The side showing now; `initial` (from the URL) until the headline is switched. */
export function useHomeView(initial: ProjectCategory): ProjectCategory {
  return useSyncExternalStore(subscribe, () => current ?? initial, () => initial);
}
