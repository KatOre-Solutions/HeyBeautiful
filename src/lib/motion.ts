import type { Variants } from "framer-motion";

// Easing presets
export const ease = {
  luxury: [0.25, 0.46, 0.45, 0.94] as const,
  cinematic: [0.16, 1, 0.3, 1] as const,
  soft: [0.4, 0, 0.2, 1] as const,
  out: [0, 0, 0.2, 1] as const,
};

// Fade up reveal — standard editorial entrance
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: ease.cinematic },
    transitionEnd: { filter: "none" },
  },
};

// Fade in (no movement)
export const fadeIn: Variants = {
  hidden: { opacity: 0, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 1, ease: ease.luxury },
    transitionEnd: { filter: "none" },
  },
};

// Slide in from left
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -48 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.9, ease: ease.cinematic },
  },
};

// Slide in from right
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 48 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.9, ease: ease.cinematic },
  },
};

// Scale reveal
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: ease.cinematic },
  },
};

// Staggered container
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

// Staggered container — slow
export const staggerContainerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.2,
    },
  },
};

// Text reveal character by character
export const textReveal: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: ease.cinematic },
  },
};

// Hero entrance — extra slow
export const heroEntrance: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.2, ease: ease.cinematic },
    transitionEnd: { filter: "none" },
  },
};

// Card hover
export const cardHover = {
  rest: { y: 0, boxShadow: "0 20px 60px rgba(0,0,0,0.08)" },
  hover: {
    y: -8,
    boxShadow: "0 40px 80px rgba(0,0,0,0.14)",
    transition: { duration: 0.5, ease: ease.luxury },
  },
};

// Glass hover
export const glassHover = {
  rest: { backdropFilter: "blur(12px)", backgroundColor: "rgba(255,255,255,0.12)" },
  hover: {
    backdropFilter: "blur(16px)",
    backgroundColor: "rgba(255,255,255,0.2)",
    transition: { duration: 0.4, ease: ease.soft },
  },
};

// Float animation (infinite)
export const floatAnimation = {
  animate: {
    y: [0, -12, 0],
    transition: {
      duration: 6,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "loop" as const,
    },
  },
};

// Shimmer line
export const shimmerLine: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 1, ease: ease.cinematic, delay: 0.3 },
  },
};
