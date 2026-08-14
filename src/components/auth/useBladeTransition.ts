"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { animate, useReducedMotion } from "framer-motion";
import { ease } from "@/lib/motion";
import type { AuthMode } from "./AuthTransitionContext";

/**
 * Blade geometry (desktop).
 *
 * The blade is wider than the card (132%, `lg:w-[132%]`) because "cover" has to
 * span the card *plus* the horizontal run of both diagonal edges. The clip is
 * `polygon(11% 0%, 100% 0%, 89% 100%, 0% 100%)`, so the painted shape leans:
 * its top edge starts 11% in from the left, its bottom edge stops 11% short of
 * the right. Covering the top-left needs `t ≤ -11%`; covering the bottom-right
 * needs `t ≥ -13.2%`. Those only overlap once the blade is ≥128% of card width —
 * at the original 118% they were contradictory and the card showed through a
 * triangle at each corner during the swap.
 *
 * Percentages are of the blade's own width; 1% of card == 100/132 == 0.758% of
 * blade. At either rest position most of the blade hangs off-canvas, clipped by
 * the card's `overflow-hidden`.
 *
 *   signin  painted edge runs card 55%→41% → form sits on the right
 *   cover   painted shape spans card -1%→102% → card fully hidden
 *   signup  painted edge runs card 59%→45% → form sits on the left
 *
 * ⚠ Mirrored in `.auth-blade` (globals.css), which owns the resting position so
 * it is correct before hydration. Change one, change both.
 */
export const BLADE_X: Record<AuthMode | "cover", string> = {
  signin: "-58%",
  cover: "-12%",
  signup: "34%",
};

/**
 * The brand text rides *against* the blade so it stays inside the visible slice
 * instead of drifting off-canvas with the overhang. The image and gradient are
 * not counter-translated — they travel with the blade, which is what makes the
 * treatment look like it's flowing across the artwork.
 *
 * Values place the wrapper's *left* edge (the copy is left-aligned within it) at
 * the left edge of the visible slice.
 */
export const CONTENT_X: Record<AuthMode | "cover", string> = {
  signin: "58%",
  cover: "12%",
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
 *
 * Rest here is the px equivalent of the CSS `translateY(calc(-100% + 240px))`,
 * since the blade's height is the card's plus SLANT.
 */
export function mobileTargets(cardHeight: number) {
  const rest = BAND_H - cardHeight - SLANT;
  return { bladeRest: rest, contentRest: -rest };
}

/** Current translate of an element, in px, as the browser actually has it. */
function currentTranslate(el: HTMLElement) {
  const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
  return { x: m.m41, y: m.m42 };
}

/**
 * Hands positioning back to `.auth-blade` in globals.css.
 *
 * Rest is defined there so it survives SSR and re-resolves whenever the card
 * changes height. Clearing the inline transform the animation left behind is
 * what lets that happen — otherwise a fixed px value would be frozen over it.
 * Safe to do without a visible jump because the animation's final value is the
 * same position the CSS resolves to.
 */
function releaseToCss(...els: (HTMLElement | null)[]) {
  for (const el of els) if (el) el.style.transform = "";
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
         * Everything is resolved to px, on both axes, every time.
         *
         * px because the start point is read back off the DOM (see the sync
         * below) and mixing units mid-interpolation is not reliable. Both axes
         * because framer composes a single transform — leaving the idle axis out
         * would let a stale value from the other breakpoint survive a rotation.
         *
         * Mobile is measured at call time, not cached: the card's height differs
         * between sign-in and sign-up, so rest is only right if it's recomputed
         * for the pane actually on screen.
         */
        const targetsFor = (position: AuthMode | "cover") => {
          if (isDesktop) {
            const w = blade.getBoundingClientRect().width;
            const pct = (v: string) => (parseFloat(v) / 100) * w;
            return {
              blade: { x: pct(BLADE_X[position]), y: 0 },
              content: { x: pct(CONTENT_X[position]), y: 0 },
            };
          }
          const cardHeight = cardRef.current?.getBoundingClientRect().height ?? 0;
          const t = mobileTargets(cardHeight);
          const atCover = position === "cover";
          return {
            blade: { x: 0, y: atCover ? 0 : t.bladeRest },
            content: { x: 0, y: atCover ? 0 : t.contentRest },
          };
        };

        /**
         * Phase 1 — sweep (desktop) or dip (mobile) to full cover.
         *
         * The start point is passed as an explicit `[from, to]` keyframe pair
         * read off the DOM, rather than letting framer infer it. framer caches a
         * motion value per element on first `animate()` and interpolates from
         * that cache, not from the element; because rest is owned by CSS — and
         * re-resolves on its own whenever the card changes height — the cache
         * goes stale between transitions. Inferring the start made the blade
         * jump to its last animated value on the first frame and ease from
         * there. Seeding with a zero-duration `animate()` does not fix it (the
         * write does not win over the cache); an explicit first keyframe does.
         */
        const from = { blade: currentTranslate(blade), content: currentTranslate(content) };
        const cover = targetsFor("cover");
        await Promise.all([
          animate(
            blade,
            { x: [from.blade.x, cover.blade.x], y: [from.blade.y, cover.blade.y] },
            options
          ).finished,
          animate(
            content,
            { x: [from.content.x, cover.content.x], y: [from.content.y, cover.content.y] },
            options
          ).finished,
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

        // Settled on rest — let CSS own the position again so it keeps tracking
        // the card's height from here.
        releaseToCss(blade, content);
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
