"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ease } from "@/lib/motion";
import { hasShownLoader } from "@/lib/pageLoader";

interface PageLoaderProps {
  /**
   * Selector for the page content container to make inert / aria-busy while the
   * loader is shown. The loader itself is a decorative, aria-hidden overlay with
   * no focusable content, so it's fine for it to live inside this container.
   */
  rootSelector?: string;
}

/**
 * Full-screen branded loader. Renders until its parent removes it via
 * AnimatePresence, which triggers the slide-up exit and — only once the exit
 * finishes and the component unmounts — releases the body scroll lock, the
 * content inert/aria-busy state, and the loading announcement.
 */
export default function PageLoader({
  rootSelector = "[data-site-root]",
}: PageLoaderProps) {
  const reducedMotion = useReducedMotion();
  // Gate the portaled announcement to client-only so createPortal never runs
  // during SSR (avoids a hydration mismatch).
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // Repeat visit: the loader is display:none before paint — never lock scroll
    // or inert the page. (Runs before HomeHero's effect marks the flag — child
    // effects fire before parent effects — so first visits still engage.)
    if (hasShownLoader()) return;

    const root = document.querySelector(rootSelector);

    // Lock scroll and compensate for the removed scrollbar so centered/fixed
    // content doesn't shift horizontally while the lock is engaged.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    // Make the obscured page content inert (not focusable / not in the a11y
    // tree) and flag it busy for assistive tech while the loader covers it.
    root?.setAttribute("inert", "");
    root?.setAttribute("aria-busy", "true");

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      root?.removeAttribute("inert");
      root?.setAttribute("aria-busy", "false");
    };
  }, [rootSelector]);

  return (
    <>
      {/* Loading announcement — portaled to <body> so it sits outside the inert
          content container and is actually announced by assistive tech. */}
      {mounted &&
        createPortal(
          <p role="status" aria-live="polite" className="sr-only">
            Loading Hey Beautiful
          </p>,
          document.body
        )}

      <motion.div
        data-page-loader
        aria-hidden="true"
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
        style={{ willChange: "transform, opacity" }}
        exit={
          reducedMotion
            ? { opacity: 0, transition: { duration: 0.5, ease: ease.out } }
            : {
                y: "-100%",
                opacity: 0.4,
                transition: { duration: 0.8, ease: ease.soft },
              }
        }
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: ease.luxury }}
        >
          {/* Breathe + glow live on their own element so the infinite keyframes
              don't override the entrance tween above. */}
          <motion.div
            animate={
              reducedMotion
                ? undefined
                : {
                    scale: [1, 1.03, 1],
                    filter: [
                      "drop-shadow(0px 0px 0px rgba(201, 151, 122, 0))",
                      "drop-shadow(0px 0px 16px rgba(201, 151, 122, 0.18))",
                      "drop-shadow(0px 0px 0px rgba(201, 151, 122, 0))",
                    ],
                  }
            }
            transition={{
              duration: 3.4,
              ease: "easeInOut",
              repeat: Infinity,
              delay: 1.1,
            }}
          >
            <Image
              src="/images/logo-hearts-white.png"
              alt=""
              width={2956}
              height={2817}
              priority
              sizes="(min-width: 768px) 180px, 140px"
              className="w-[140px] md:w-[180px] h-auto select-none"
            />
          </motion.div>
        </motion.div>

        {/* Indeterminate loading line — communicates activity, not progress. */}
        <div className="mt-10 h-[2px] w-[120px] overflow-hidden rounded-full bg-rose-gold/15">
          <motion.div
            className="h-full w-12 rounded-full bg-rose-gold"
            animate={
              reducedMotion
                ? { opacity: [0.35, 0.9, 0.35] }
                : { x: ["-100%", "250%"] }
            }
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 0.2,
            }}
          />
        </div>
      </motion.div>
    </>
  );
}
