"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface SocialAuthButtonsProps {
  onGoogle: () => Promise<void>;
  onApple: () => Promise<void>;
  /** Divider caption, e.g. "or sign in with email". */
  dividerLabel?: string;
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A9 9 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A9 9 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 384 512" fill="currentColor" aria-hidden>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

export default function SocialAuthButtons({
  onGoogle,
  onApple,
  dividerLabel = "or continue with email",
}: SocialAuthButtonsProps) {
  const [busy, setBusy] = useState<"google" | "apple" | null>(null);

  const run = async (which: "google" | "apple", fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(which);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  return (
    <motion.div variants={fadeUp} className="flex flex-col gap-3">
      {/* Google */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        disabled={busy !== null}
        onClick={() => run("google", onGoogle)}
        className="flex items-center justify-center gap-3 w-full py-3.5 rounded-full bg-white transition-colors hover:bg-[#faf8f5] disabled:opacity-60"
        style={{ border: "1px solid rgba(232,220,208,1)" }}
      >
        <GoogleIcon />
        <span
          className="text-[#1e1814] text-sm font-medium"
          style={{ fontFamily: "var(--font-manrope)" }}
        >
          {busy === "google" ? "Connecting…" : "Continue with Google"}
        </span>
      </motion.button>

      {/* Apple */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        disabled={busy !== null}
        onClick={() => run("apple", onApple)}
        className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-full text-white transition-colors hover:bg-black disabled:opacity-60"
        style={{ background: "#1e1814" }}
      >
        <AppleIcon />
        <span
          className="text-sm font-medium"
          style={{ fontFamily: "var(--font-manrope)" }}
        >
          {busy === "apple" ? "Connecting…" : "Continue with Apple"}
        </span>
      </motion.button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px" style={{ background: "rgba(201,151,122,0.25)" }} />
        <span className="label-caps text-[#1e1814]/40" style={{ fontSize: "9px" }}>
          {dividerLabel}
        </span>
        <div className="flex-1 h-px" style={{ background: "rgba(201,151,122,0.25)" }} />
      </div>
    </motion.div>
  );
}
