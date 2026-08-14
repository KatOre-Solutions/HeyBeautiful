import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette
        blush: {
          50: "#fdf8f6",
          100: "#f9ede8",
          200: "#f3d5cb",
          300: "#e9b5a4",
          400: "#db8d77",
          500: "#cc6b52",
          600: "#b85040",
          700: "#9a3e34",
          800: "#7f342d",
          900: "#692e28",
        },
        sand: {
          50: "#faf8f5",
          100: "#f3ede4",
          200: "#e5d8c6",
          300: "#d3be9f",
          400: "#bda07a",
          500: "#a8845d",
          600: "#906d4e",
          700: "#775843",
          800: "#61493a",
          900: "#503d33",
        },
        rose: {
          gold: "#c9977a",
          light: "#f5ddd5",
          dark: "#8b5e52",
        },
        cream: "#faf7f4",
        parchment: "#f0ebe3",
        // Primary text/ink brown — used site-wide for headings and body copy.
        ink: "#1e1814",
        // Official brand palette (auth screens). Deliberately separate tokens from
        // cream/parchment above — the values are close but not identical.
        "dusty-pink": "#b47792",
        "off-white": "#fff9f9",
        "soft-tan": "#fdf0ec",
        "dark-emerald": "#45563b",
        // Named `auth-royal`, not folded into the `royal` scale below: that scale is a
        // different (brighter) blue reserved site-wide, and this one must not displace it.
        "auth-royal": "#3b4a78",
        // Royal blue accent
        royal: {
          50: "#eff3ff",
          100: "#dce6fd",
          200: "#c0d0fb",
          300: "#96b1f9",
          400: "#6587f5",
          500: "#4361ee",
          600: "#2f43e3",
          700: "#2733d0",
          800: "#262ba9",
          900: "#252b85",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "serif"],
        body: ["var(--font-manrope)", "sans-serif"],
      },
      backgroundImage: {
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)",
        "warm-glow":
          "radial-gradient(ellipse at top, #f9ede8 0%, #faf7f4 60%, #f3ede4 100%)",
        "hero-overlay":
          "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.55) 100%)",
        "card-shimmer":
          "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
        // Rose Gold Gradient — the primary brand expression. Wide/soft for large
        // surfaces (the auth blade, overlays).
        "rose-gold-gradient":
          "linear-gradient(135deg, #faf7f4 0%, #f5ddd5 24%, #c9977a 54%, #b47792 78%, #8b5e52 100%)",
        // Tighter, richer variant sized so white label text stays legible on top.
        "rose-gold-gradient-button":
          "linear-gradient(135deg, #c9977a 0%, #b47792 55%, #8b5e52 100%)",
        // Diagonal metallic highlight, swept across the blade to read as polished
        // metal rather than a printed gradient.
        "rose-gold-sheen":
          "linear-gradient(115deg, transparent 38%, rgba(255,249,249,0.65) 48%, rgba(255,249,249,0.2) 54%, transparent 66%)",
      },
      backdropBlur: {
        xs: "2px",
        glass: "12px",
        heavy: "24px",
      },
      boxShadow: {
        glass: "0 4px 30px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255,255,255,0.4)",
        "glass-hover": "0 8px 40px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.5)",
        luxury: "0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
        "luxury-hover": "0 30px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)",
        soft: "0 2px 20px rgba(0,0,0,0.06)",
        glow: "0 0 40px rgba(201,151,122,0.3)",
        "glow-rose-gold": "0 0 48px rgba(180,119,146,0.35)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "shimmer": "shimmer 3s ease-in-out infinite",
        "fade-up": "fadeUp 0.8s ease forwards",
        "pulse-soft": "pulseSoft 4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      spacing: {
        "section": "120px",
        "section-sm": "80px",
        "section-xs": "60px",
      },
      transitionTimingFunction: {
        "luxury": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "cinematic": "cubic-bezier(0.16, 1, 0.3, 1)",
        "soft": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
        "800": "800ms",
        "1000": "1000ms",
        "1200": "1200ms",
      },
    },
  },
  plugins: [],
};

export default config;
