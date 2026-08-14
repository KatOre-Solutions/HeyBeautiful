"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { animate, useReducedMotion } from "framer-motion";
import { ease } from "@/lib/motion";
import type { AuthMode } from "./AuthTransitionContext";

/**
 * Blade geometry.
 *
 * The blade element is deliberately wider than the card (118%): to reach full
 * cover it must span the whole card *plus* the horizontal run of its diagonal
 * edges, so at either rest position most of it hangs off-canvas, clipped by the
 * card's `overflow-hidden`. Percentages below are of the blade's own width —
 * 1% of card width == 100/118 == 0.847% of blade width.
 *
 *   signin  blade spans card [0%, 48%]   → form sits on the right
 *   cover   blade spans card [-9%, 109%] → card fully hidden
 *   signup  blade spans card [52%, 100%] → form sits on the left
 */
export const BLADE_X: Record<AuthMode | "cover", string> = {
  signin: "-59%",
  cover: "-8%",
  signup: "44%",
};

/**
 * The brand text rides *against* the blade so it stays inside the visible slice
 * instead of drifting off-canvas with the overhang. The image and gradient are
 * not counter-translated — they travel with the blade, which is what makes the
 * treatment look like it's flowing across the artwork.
 *
 * Values place the wrapper's *left* edge (the copy is left-aligned within it) at
 * the left edge of the visible slice: card 0% for signin, card 52% for signup.
 */
export const CONTENT_X: Record<AuthMode | "cover", string> = {
  signin: "59%",
  cover: "8%",
  signup: "0%",
};

/**
 * Mobile geometry (below `lg`).
 *
 * Portrait can't spare ~48% of its width to a diagonal panel, so below `lg` the
 * blade becomes a band across the top and the motion rotates: it dips *down* to
 * cover the card, the mode swaps underneath, and it retracts. Rest is the same
 * position for both modes — there are no sides to flip between.
 *
 * Unlike the desktop percentages these are measured pixels, because the card's
 * height is content-driven and differs between sign-in and sign-up.
 *
 * ⚠ BAND_H is duplicated as the form slot's top padding in AuthCard, and SLANT
 * as the `40px` in `.auth-blade-clip` (globals.css) and the blade's extra height.
 * Changing either means changing all three.
 */
export const BAND_H = 240;
export const SLANT = 40;

/**
 * At rest the blade is lifted so its bottom edge lands at BAND_H; at cover it
 * sits at 0 and spans the whole card. The copy counter-translates exactly, the
 * same trick the desktop axis uses to hold it inside the visible slice.
 */
export function mobileTargets(cardHeight: number) {
  const rest = BAND_H - cardHeight - SLANT;
  return {
    blade: { rest: `${rest}px`, cover: "0px" },
    content: { rest: `${-rest}px`, cover: "0px" },
  };
}

const SWEEP_DURATION = 0.55;

/**
 * Failsafe only. The reveal waits on an explicit readiness signal from the
 * incoming pane; this exists purely so a route that never mounts can't strand
 * the blade covering the whole card. It never gates the happy path.
 */
const READY_TIMEOUT_MS = 1200;

/** The counter-translated copy wrapper lives inside the blade. */
export function getBladeContent(blade: HTMLElement | null) {
  return blade?.querySelector<HTMLElement>("[data-blade-content]") ?? null;
}

export function useBladeTransition({
  bladeRef,
  cardRef,
  isDesktop,
  mode,
}: {
  bladeRef: RefObject<HTMLDivElement | null>;
  cardRef: RefObject<HTMLElement | null>;
  isDesktop: boolean;
  mode: AuthMode;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // A ref, not state: a rapid second click must be rejected synchronously,
  // before React has had a chance to re-render.
  const animatingRef = useRef(false);
  const mountedModeRef = useRef<AuthMode | null>(null);
  const pendingRef = useRef<{ mode: AuthMode; resolve: () => void } | null>(null);

  const notifyPaneReady = useCallback((readyMode: AuthMode) => {
    mountedModeRef.current = readyMode;
    const pending = pendingRef.current;
    if (pending?.mode !== readyMode) return;
    pendingRef.current = null;
    pending.resolve();
  }, []);

  // Never leave an awaiting transition hanging on an unmounted tree.
  useEffect(() => {
    return () => {
      pendingRef.current?.resolve();
      pendingRef.current = null;
    };
  }, []);

  const waitForPaneReady = useCallback((next: AuthMode) => {
    // The pane can mount before we get here — don't wait for a signal already sent.
    if (mountedModeRef.current === next) return Promise.resolve();
    return new Promise<void>((resolve) => {
      pendingRef.current = { mode: next, resolve };
    });
  }, []);

  const requestSwitch = useCallback(
    async (nextMode: AuthMode, href: string) => {
      if (animatingRef.current || nextMode === mode) return;
      animatingRef.current = true;
      setIsTransitioning(true);

      const blade = bladeRef.current;
      const content = getBladeContent(blade);

      try {
        if (reduceMotion || !blade || !content) {
          router.replace(href);
          return;
        }

        const options = { duration: SWEEP_DURATION, ease: ease.cinematic };

        /**
         * Both axes are always written, never just the active one. Framer reads
         * the element's current transform, so animating only `y` while a stale
         * `translateX` is still on the blade (i.e. right after crossing the
         * breakpoint) would compose the two and park it off-card.
         *
         * Mobile is measured at call time, not cached: the card's height changes
         * between sign-in and sign-up, so the rest position is only correct if
         * it's recomputed for the pane that's actually on screen.
         */
        const targetsFor = (position: AuthMode | "cover") => {
          if (isDesktop) {
            return {
              blade: { x: BLADE_X[position], y: 0 },
              content: { x: CONTENT_X[position], y: 0 },
            };
          }
          const cardHeight = cardRef.current?.getBoundingClientRect().height ?? 0;
          const t = mobileTargets(cardHeight);
          const key = position === "cover" ? "cover" : "rest";
          return {
            blade: { x: 0, y: t.blade[key] },
            content: { x: 0, y: t.content[key] },
          };
        };

        // Phase 1 — sweep (desktop) or dip (mobile) to full cover.
        const cover = targetsFor("cover");
        await Promise.all([
          animate(blade, cover.blade, options).finished,
          animate(content, cover.content, options).finished,
        ]);

        // Phase 2 — swap the route while the card is hidden, then wait for the
        // incoming pane to actually be up. Racing a watchdog so a failed or
        // cancelled navigation can't strand the blade over the card.
        router.replace(href);

        let watchdog: ReturnType<typeof setTimeout> | undefined;
        await Promise.race([
          waitForPaneReady(nextMode),
          new Promise<void>((resolve) => {
            watchdog = setTimeout(() => {
              if (process.env.NODE_ENV !== "production") {
                console.warn(
                  `[AuthCard] "${nextMode}" pane did not report ready within ${READY_TIMEOUT_MS}ms; revealing anyway.`
                );
              }
              resolve();
            }, READY_TIMEOUT_MS);
          }),
        ]);
        clearTimeout(watchdog);

        // Phase 3 — reveal. Measured now, after the swap, so mobile picks up the
        // incoming pane's height rather than the outgoing one's.
        const rest = targetsFor(nextMode);
        await Promise.all([
          animate(blade, rest.blade, options).finished,
          animate(content, rest.content, options).finished,
        ]);
      } finally {
        // Any throw or early return still has to release the lock — a stuck
        // blade would block the whole card.
        animatingRef.current = false;
        setIsTransitioning(false);
      }
    },
    [mode, reduceMotion, router, bladeRef, cardRef, isDesktop, waitForPaneReady]
  );

  return { requestSwitch, isTransitioning, notifyPaneReady };
}
