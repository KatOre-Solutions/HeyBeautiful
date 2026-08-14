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
 * Server snapshot.
 *
 * The value is arbitrary and safe *because nothing renders from `isDesktop`*.
 * The blade's resting position is owned entirely by the `.auth-blade` rules in
 * globals.css, so markup and first paint are correct at any width without this
 * hook being right. It is read only inside `requestSwitch`, which runs on a user
 * click — long after `useSyncExternalStore` has reconciled against the real
 * `matchMedia` in a post-hydration commit.
 *
 * That ordering is worth being explicit about: the reconciliation lands *after*
 * paint, not before it. An earlier version parked the blade from a layout effect
 * using this value, and on a phone the hydration commit wrote the desktop axis
 * for a frame. The fix was to stop rendering from it, not to make the snapshot
 * cleverer — so if you ever drive layout or markup off `isDesktop`, this hook
 * alone will not save you from a hydration flash.
 */
function getServerSnapshot() {
  return true;
}

export function useIsDesktop() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
