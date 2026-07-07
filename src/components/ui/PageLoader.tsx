"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ease } from "@/lib/motion";

/** sessionStorage flag marking that the loader has been shown this session. */
export const LOADER_SESSION_KEY = "hb-loader-shown";

/**
 * Full-screen branded loader. Renders until its parent removes it via
 * AnimatePresence, which triggers the slide-up exit and — only once the exit
 * finishes and the component unmounts — releases the body scroll lock.
 */
export default function PageLoader() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Repeat visit: the loader is display:none before paint — never lock scroll.
    // (Runs before HomeHero's effect sets the flag, so first visits still lock.)
    let seen = false;
    try {
      seen = !!sessionStorage.getItem(LOADER_SESSION_KEY);
    } catch {}
    if (seen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
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
            sizes="180px"
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
  );
}
