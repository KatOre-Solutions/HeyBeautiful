"use client";

import { useSyncExternalStore } from "react";

/**
 * Tracks whether the viewport is at or above Tailwind's `lg` breakpoint.
 *
 * The auth card needs this in JS, not just CSS: Framer Motion writes inline
 * transforms, so the transition has to know which axis it's animating — X on
 * desktop (blade rests to one side), Y on mobile (band dips down from the top).
 *
 * ⚠ 1024px is duplicated between this query and the `lg:` classes in AuthCard /
 * AuthBlade. There's no shared breakpoint token in this project, so the two must
 * be kept in step by hand — if one moves, the other has to move with it, or the
 * layout and the animation axis will disagree around the crossover.
 */
const QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/**
 * Server snapshot. Nothing positions the blade during SSR — parking happens in a
 * layout effect — so this only sets the value for the first client render, which
 * `useSyncExternalStore` immediately reconciles against the real `matchMedia`
 * before paint. Using the store (rather than useState + useEffect) is what keeps
 * a wrong-axis park from flashing on load.
 */
function getServerSnapshot() {
  return true;
}

export function useIsDesktop() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
