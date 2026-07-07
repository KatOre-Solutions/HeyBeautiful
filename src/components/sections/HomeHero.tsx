"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Hero from "@/components/sections/Hero";
import PageLoader, { LOADER_SESSION_KEY } from "@/components/ui/PageLoader";
import { ease } from "@/lib/motion";

/** How long to wait for the video before revealing anyway. */
const FALLBACK_MS = 5000;

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

  const handleVideoReady = useCallback(() => setVideoReady(true), []);

  useEffect(() => {
    if (skipped) return;
    let seen = false;
    try {
      seen = !!sessionStorage.getItem(LOADER_SESSION_KEY);
    } catch {}
    shownThisSpaSession = true;
    if (seen) {
      // Loader is already display:none via the injected style — drop it silently.
      setSkipped(true);
      return;
    }
    try {
      sessionStorage.setItem(LOADER_SESSION_KEY, "1");
    } catch {}
    const fallback = setTimeout(() => setVideoReady(true), FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, [skipped]);

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
      <AnimatePresence>
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
