"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";

interface AuthErrorToastProps {
  message: string;
  onDismiss: () => void;
  /** Auto-dismiss after this many ms (default 5000). */
  duration?: number;
}

export default function AuthErrorToast({
  message,
  onDismiss,
  duration = 5000,
}: AuthErrorToastProps) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [message, duration, onDismiss]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-6 z-[90] w-[320px] max-w-[90vw] rounded-2xl overflow-hidden flex items-start gap-3 px-4 py-3.5"
          style={{
            // The rose-gold edge is painted as a background layer, not a
            // border-image: border-image is not clipped by border-radius and
            // fills all four edges, so it squared off the toast's rounded
            // corners and tinted the other three hairlines. A background is
            // clipped by the radius, so the corners survive.
            backgroundColor: "rgba(255, 249, 249, 0.92)",
            backgroundImage: "linear-gradient(180deg, #c9977a, #b47792, #8b5e52)",
            backgroundRepeat: "no-repeat",
            backgroundSize: "3px 100%",
            backgroundPosition: "left center",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(180,119,146,0.25)",
            boxShadow: "0 12px 40px rgba(30,24,20,0.16)",
          }}
          role="alert"
        >
          <AlertCircle size={18} className="text-dusty-pink flex-shrink-0 mt-0.5" />
          <p
            className="flex-1 text-ink leading-snug"
            style={{ fontFamily: "var(--font-manrope)", fontSize: "0.8rem" }}
          >
            {message}
          </p>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-ink/5 transition-colors"
            aria-label="Dismiss"
          >
            <X size={12} className="text-ink/40" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
