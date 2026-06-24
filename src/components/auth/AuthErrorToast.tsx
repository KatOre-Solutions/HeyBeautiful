"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import { FirebaseError } from "firebase/app";

const errorMessages: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/invalid-credential": "Incorrect email or password. Please try again.",
  "auth/user-not-found": "No account found with this email.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Connection error. Please check your internet.",
  "auth/popup-closed-by-user": "", // user cancelled — stay silent
  "auth/cancelled-popup-request": "",
  "auth/account-exists-with-different-credential":
    "This email is already linked to a different sign-in method.",
};

/**
 * Translate any thrown auth error into a friendly message.
 * Returns "" for errors that should be silently ignored (e.g. cancelled popups).
 */
export function getAuthErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code in errorMessages) return errorMessages[err.code];
    return "Something went wrong. Please try again.";
  }
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Please try again.";
}

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
            background: "rgba(250, 247, 244, 0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderLeft: "3px solid #c9977a",
            border: "1px solid rgba(201,151,122,0.25)",
            boxShadow: "0 12px 40px rgba(30,24,20,0.16)",
          }}
          role="alert"
        >
          <AlertCircle size={18} className="text-[#c9977a] flex-shrink-0 mt-0.5" />
          <p
            className="flex-1 text-[#1e1814] leading-snug"
            style={{ fontFamily: "var(--font-manrope)", fontSize: "0.8rem" }}
          >
            {message}
          </p>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-[#1e1814]/5 transition-colors"
            aria-label="Dismiss"
          >
            <X size={12} className="text-[#1e1814]/40" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
