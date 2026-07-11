"use client";

import { useRef, useEffect } from "react";
import { preload } from "react-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, Sparkles } from "lucide-react";
import { heroEntrance, staggerContainer, fadeUp, shimmerLine, ease } from "@/lib/motion";

const HERO_VIDEO_SRC = "/video/hero-video.mp4";

interface HeroProps {
  /** Fired once when the background video has decoded its first frame (or errored). */
  onVideoReady?: () => void;
  /** When false, entrance animations hold at "hidden" until flipped to true. */
  startEntrance?: boolean;
}

export default function Hero({ onVideoReady, startEntrance = true }: HeroProps) {
  // Hoists <link rel="preload" as="video"> into the head during SSR so the
  // browser starts the download with the initial HTML, before hydration.
  // High priority: the page reveal blocks on this video.
  preload(HERO_VIDEO_SRC, {
    as: "video",
    type: "video/mp4",
    fetchPriority: "high",
  });

  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const onVideoReadyRef = useRef(onVideoReady);
  onVideoReadyRef.current = onVideoReady;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [0, 0.4]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

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

    // loadeddata (HAVE_CURRENT_DATA) over canplaythrough — the latter is
    // unreliable on Safari/iOS and slow networks; the video keeps buffering
    // while it plays, unnoticed. readyState covers the already-cached case.
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA || video.error) {
      ready();
    } else {
      video.addEventListener("loadeddata", ready, { once: true });
      video.addEventListener("error", ready, { once: true });
    }

    video.play().catch(() => {});

    return () => {
      video.removeEventListener("loadeddata", ready);
      video.removeEventListener("error", ready);
      if (paintDelay) clearTimeout(paintDelay);
    };
  }, []);

  return (
    <section
      ref={ref}
      className="relative w-full h-screen min-h-[700px] overflow-hidden bg-[#1e1814]"
    >
      {/* Video background */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{ y: parallaxY }}
      >
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
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
            variants={fadeUp}
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
            variants={heroEntrance}
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
            variants={shimmerLine}
            className="flex justify-center mb-8"
          >
            <div className="h-px w-20 bg-[#c9977a]/60 origin-center" />
          </motion.div>

          {/* Sub copy */}
          <motion.p
            variants={fadeUp}
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
            variants={fadeUp}
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
          animate={{ y: [0, 8, 0] }}
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
