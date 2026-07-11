"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Hero from "@/components/sections/Hero";
import PageLoader from "@/components/ui/PageLoader";
import {
  LOADER_SESSION_KEY,
  engagePageLock,
  hasShownLoader,
  markLoaderShown,
} from "@/lib/pageLoader";
import { ease } from "@/lib/motion";

/** How long to wait for the video before revealing anyway. */
const FALLBACK_MS = 5000;

/** Content container made inert / scroll-locked while the loader is up. */
const ROOT_SELECTOR = "[data-site-root]";

// Survives client-side route changes; resets on full reload, where
// sessionStorage (checked pre-paint by the inline script) takes over.
let shownThisSpaSession = false;

// Runs during HTML parse, before first paint — hides the SSR'd loader on
// repeat visits so it never flashes. Injects a <style> rather than touching
// React-managed attributes (a class on <html> triggers a hydration mismatch).
const skipScript = `try{if(sessionStorage.getItem("${LOADER_SESSION_KEY}")){var s=document.createElement("style");s.textContent="[data-page-loader]{display:none!important}";document.head.appendChild(s)}}catch(e){}`;

export default function HomeHero() {
  // false at hydration (matches SSR), true on fresh SPA re-mounts.
  const [skipped, setSkipped] = useState(() => shownThisSpaSession);
  const [videoReady, setVideoReady] = useState(false);
  const [settled, setSettled] = useState(false);
  const reducedMotion = useReducedMotion();

  // Release fn for the first-visit scroll-lock / inert. Held in a ref so the
  // loader's exit-complete (below) can release it *after* the slide-up finishes,
  // keeping the page locked while the loader animates away.
  const releaseLockRef = useRef<(() => void) | null>(null);

  const handleVideoReady = useCallback(() => setVideoReady(true), []);

  useEffect(() => {
    // videoReady in the guard/deps: once the video signals ready before the
    // fallback fires, this re-runs, the cleanup clears the stale timer, and we
    // return early without arming a new one. (The lock is intentionally NOT
    // released in this cleanup — it must survive until the loader's exit
    // animation completes; see onExitComplete below.)
    if (skipped || videoReady) return;
    const seen = hasShownLoader();
    shownThisSpaSession = true;
    if (seen) {
      // Loader is already display:none via the injected style — drop it silently.
      setSkipped(true);
      return;
    }
    // First visit: the orchestrator reads + writes the flag and engages the
    // page lock atomically here, so neither depends on PageLoader's effect
    // running first. This makes the lock robust to a future Suspense/wrapper
    // boundary reordering child-before-parent effects.
    markLoaderShown();
    releaseLockRef.current = engagePageLock(ROOT_SELECTOR);
    const fallback = setTimeout(() => setVideoReady(true), FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, [skipped, videoReady]);

  // Safety net: if HomeHero unmounts while still locked (e.g. navigation away
  // before the loader's exit runs), release on true unmount. Empty deps so this
  // fires only on unmount, never on the videoReady flip. The normal release
  // path is the loader's onExitComplete.
  useEffect(() => () => releaseLockRef.current?.(), []);

  const revealed = skipped || videoReady;

  // Brief "settle" as the loader lifts: a fixed backdrop-blur overlay whose
  // opacity fades out — the only animated property, so it stays on the
  // compositor. It mounts at the reveal and unmounts ~0.5s later, so the
  // blur costs GPU time only during the unveil; the hero subtree itself
  // never carries a filter, stacking context, or will-change.
  const showSettle = !skipped && !reducedMotion && videoReady && !settled;

  // Conditional siblings keep their JSX slots, so Hero never remounts (a
  // remount would restart the video).
  return (
    <>
      {!skipped && <script dangerouslySetInnerHTML={{ __html: skipScript }} />}
      <AnimatePresence
        onExitComplete={() => {
          // Loader's slide-up has finished — now release the lock/inert. On
          // repeat visits the ref is null (lock never engaged), so this no-ops.
          releaseLockRef.current?.();
          releaseLockRef.current = null;
        }}
      >
        {!skipped && !videoReady && <PageLoader />}
      </AnimatePresence>
      {showSettle && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[99] bg-ink/5"
          style={{
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            willChange: "opacity",
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: ease.out }}
          onAnimationComplete={() => setSettled(true)}
        />
      )}
      <Hero onVideoReady={handleVideoReady} startEntrance={revealed} />
    </>
  );
}
