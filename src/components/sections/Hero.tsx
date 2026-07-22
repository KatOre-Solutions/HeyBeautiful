"use client";

import { useRef, useEffect } from "react";
import { preload } from "react-dom";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowDown, Sparkles } from "lucide-react";
import { heroEntrance, staggerContainer, fadeUp, shimmerLine, ease } from "@/lib/motion";
import { shouldLoadHeroVideo } from "@/lib/network";

const HERO_VIDEO_SRC = "/video/hero-video.mp4";
const HERO_POSTER_SRC = "/video/hero-poster.webp";

/**
 * Reduced-motion twins of the entrance variants.
 *
 * `hidden` is reused by reference and must stay identical to the original:
 * framer-motion serialises it into the SSR'd style, and useReducedMotion() is
 * null server-side, so a reduced-motion-dependent `hidden` would mismatch on
 * hydration and remount the <video> (see HomeHero's note on remounting).
 * Only `transition` differs — it is runtime-only and never serialised.
 *
 * Opacity still fades; it's movement that prefers-reduced-motion is about.
 */
const reducedTransition = {
  duration: 0.4,
  ease: ease.out,
  y: { duration: 0 },
  filter: { duration: 0 },
  scaleX: { duration: 0 },
};
const withReducedTransition = (v: typeof fadeUp) => ({
  hidden: v.hidden,
  visible: { ...v.visible, transition: reducedTransition },
});
const fadeUpReduced = withReducedTransition(fadeUp);
const heroEntranceReduced = withReducedTransition(heroEntrance);
const shimmerLineReduced = withReducedTransition(shimmerLine);

interface HeroProps {
  /** Fired once when the background video has decoded its first frame (or errored). */
  onVideoReady?: () => void;
  /** When false, entrance animations hold at "hidden" until flipped to true. */
  startEntrance?: boolean;
}

export default function Hero({ onVideoReady, startEntrance = true }: HeroProps) {
  // Preloads the poster, not the video: the poster is what paints first, and a
  // <link> already flushed into the SSR'd head cannot be withdrawn — preloading
  // the video would download it even for the Save-Data/reduced-motion paths that
  // deliberately skip it.
  preload(HERO_POSTER_SRC, { as: "image", fetchPriority: "high" });

  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion();

  const onVideoReadyRef = useRef(onVideoReady);
  onVideoReadyRef.current = onVideoReady;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Reduced motion flattens the output range rather than dropping the transform:
  // both branches emit the same value at scroll 0, so SSR and hydration agree.
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", reducedMotion ? "0%" : "30%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [0, reducedMotion ? 0 : 0.4]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", reducedMotion ? "0%" : "15%"]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let fired = false;
    let paintDelay: ReturnType<typeof setTimeout> | undefined;

    // Brief delay after the first frame decodes so it's painted before the unveil.
    const ready = () => {
      if (fired) return;
      fired = true;
      paintDelay = setTimeout(() => onVideoReadyRef.current?.(), 250);
    };

    // A background tab pauses playback the instant it starts, and dropping
    // autoPlay means the browser no longer retries on our behalf — without this,
    // a page opened in a background tab would show a frozen first frame forever.
    const tryPlay = () => void video.play().catch(() => {});
    const onVisible = () => {
      if (!document.hidden) tryPlay();
    };

    const cleanup = () => {
      video.removeEventListener("loadeddata", ready);
      video.removeEventListener("error", ready);
      document.removeEventListener("visibilitychange", onVisible);
      if (paintDelay) clearTimeout(paintDelay);
    };

    // Skip the download entirely and stay on the poster. `ready()` must still
    // fire or the loader waits out its full fallback with nothing coming.
    if (reducedMotion || !shouldLoadHeroVideo()) {
      ready();
      return cleanup;
    }

    // loadeddata (HAVE_CURRENT_DATA) over canplaythrough — the latter is
    // unreliable on Safari/iOS and slow networks; the video keeps buffering
    // while it plays, unnoticed. readyState covers the already-cached case.
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA || video.error) {
      ready();
    } else {
      video.addEventListener("loadeddata", ready, { once: true });
      video.addEventListener("error", ready, { once: true });
    }

    // load() explicitly: the element is preload="none" with no autoPlay, and the
    // spec only says a UA *may* re-fetch when `preload` changes. Called before
    // play() so the fetch doesn't depend on autoplay permission — iOS Low Power
    // Mode rejects play(), and we still want the first frame to arrive.
    video.load();
    tryPlay();
    document.addEventListener("visibilitychange", onVisible);

    return cleanup;
    // reducedMotion is read once at first render and never updates, so this
    // still runs exactly once — the video must not be re-loaded on re-render.
  }, [reducedMotion]);

  return (
    <section
      ref={ref}
      className="relative w-full h-svh min-h-[700px] overflow-hidden bg-[#1e1814]"
    >
      {/* Video background */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{ y: parallaxY }}
      >
        {/* No autoPlay, and preload="none": autoPlay starts the fetch regardless
            of the preload hint, which would defeat the reduced-motion and
            Save-Data paths. The effect above drives load()/play() instead.
            The poster carries first paint until the first frame decodes. */}
        <video
          ref={videoRef}
          loop
          muted
          playsInline
          preload="none"
          poster={HERO_POSTER_SRC}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scale(1.05)" }}
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>

        {/* Cinematic warm tint overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(30,24,20,0.2) 0%, rgba(30,24,20,0.1) 30%, rgba(30,24,20,0.45) 75%, rgba(30,24,20,0.72) 100%)",
          }}
        />

        {/* Warm golden-hour color grade */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 40%, rgba(201,151,122,0.18) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(139,94,82,0.12) 0%, transparent 50%)",
            mixBlendMode: "overlay",
          }}
        />

        {/* Scroll-driven fade */}
        <motion.div
          className="absolute inset-0 bg-[#1e1814]"
          style={{ opacity: overlayOpacity }}
        />
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-end h-full pb-20 md:pb-28 section-padding text-center"
        style={{ y: contentY }}
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={startEntrance ? "visible" : "hidden"}
          className="max-w-4xl mx-auto"
        >
          {/* Label */}
          <motion.div
            variants={reducedMotion ? fadeUpReduced : fadeUp}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="h-px w-10 bg-[#c9977a]/70" />
            <span className="label-caps text-[#c9977a]/90 tracking-[0.22em]">
              Premium Feminine Wellness
            </span>
            <div className="h-px w-10 bg-[#c9977a]/70" />
          </motion.div>

          {/* Main heading */}
          <motion.h1
            variants={reducedMotion ? heroEntranceReduced : heroEntrance}
            className="heading-display text-white mb-6"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(3rem, 8vw, 7rem)",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              lineHeight: 1.02,
            }}
          >
            Fuel Your Strength.
            <br />
            <em style={{ fontStyle: "italic", color: "#e8c4ad" }}>
              Keep Your Glow.
            </em>
          </motion.h1>

          {/* Deco line */}
          <motion.div
            variants={reducedMotion ? shimmerLineReduced : shimmerLine}
            className="flex justify-center mb-8"
          >
            <div className="h-px w-20 bg-[#c9977a]/60 origin-center" />
          </motion.div>

          {/* Sub copy */}
          <motion.p
            variants={reducedMotion ? fadeUpReduced : fadeUp}
            className="text-white/75 mb-12 max-w-lg mx-auto leading-relaxed"
            style={{
              fontFamily: "var(--font-manrope)",
              fontSize: "clamp(0.9rem, 2vw, 1.05rem)",
              fontWeight: 300,
              letterSpacing: "0.02em",
            }}
          >
            Precision-crafted supplements for women who refuse to choose between
            performance and femininity.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={reducedMotion ? fadeUpReduced : fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#products"
              className="btn-primary px-10 py-4 text-[11px] tracking-[0.12em] shadow-glow"
            >
              <Sparkles size={14} />
              Shop the Collection
            </a>
            <a
              href="#story"
              className="btn-glass px-10 py-4 text-[11px] tracking-[0.12em]"
            >
              Our Story
            </a>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 16 }}
        animate={startEntrance ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ delay: 2, duration: 1, ease: ease.cinematic }}
      >
        <motion.div
          animate={reducedMotion ? { y: 0 } : { y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown size={16} className="text-white/50" />
        </motion.div>
        <span className="label-caps text-white/40 text-[9px] tracking-[0.2em]">
          Scroll
        </span>
      </motion.div>

      {/* Bottom edge fade into next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(to top, #faf7f4 0%, transparent 100%)",
        }}
      />
    </section>
  );
}
