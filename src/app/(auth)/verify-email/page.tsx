"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle } from "lucide-react";
import { fadeUp } from "@/lib/motion";
import { useAuth } from "@/context/AuthContext";
import AuthForm from "@/components/auth/AuthForm";
import AuthErrorToast, { getAuthErrorMessage } from "@/components/auth/AuthErrorToast";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loading, sendVerification, signOut } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  // No session (e.g. opened directly) — nothing to verify, send to login.
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const handleResend = async () => {
    if (resending) return;
    setError("");
    setResending(true);
    try {
      await sendVerification();
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Don't flash the verify UI before auth resolves or while redirecting a
  // sessionless visitor out (this route is intentionally not proxy-gated).
  if (loading || !user) {
    return (
      <div className="w-full max-w-sm flex items-center justify-center">
        <span className="label-caps text-rose-gold/70" style={{ fontSize: "11px" }}>
          Loading…
        </span>
      </div>
    );
  }

  return (
    <>
      <AuthForm title="Verify Your Email">
        <div className="flex flex-col items-center text-center">
          <motion.div
            variants={fadeUp}
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{
              background: "rgba(201,151,122,0.1)",
              border: "1px solid rgba(201,151,122,0.22)",
            }}
          >
            <Mail size={40} className="text-rose-gold" />
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="text-ink/55"
            style={{ fontFamily: "var(--font-manrope)", fontSize: "0.88rem" }}
          >
            We&apos;ve sent a verification link to:
          </motion.p>
          <motion.p
            variants={fadeUp}
            className="text-ink mb-1 mt-1"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "1.3rem",
              fontWeight: 600,
            }}
          >
            {user?.email ?? "your email"}
          </motion.p>
          <motion.p
            variants={fadeUp}
            className="text-ink/45 leading-relaxed mb-7 max-w-xs"
            style={{ fontFamily: "var(--font-manrope)", fontSize: "0.8rem" }}
          >
            Click the link in your email to activate your account and start
            shopping.
          </motion.p>

          {/* Resend */}
          <motion.div variants={fadeUp} className="w-full mb-3">
            <AnimatePresence mode="wait">
              {resent ? (
                <motion.div
                  key="resent"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2 py-3"
                >
                  <CheckCircle size={16} className="text-rose-gold" />
                  <span
                    className="text-rose-gold"
                    style={{ fontFamily: "var(--font-manrope)", fontSize: "0.82rem" }}
                  >
                    Verification email sent
                  </span>
                </motion.div>
              ) : (
                <motion.button
                  key="resend-btn"
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="btn-outline w-full disabled:opacity-60"
                >
                  {resending ? "Sending…" : "Resend Verification Email"}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.button
            variants={fadeUp}
            type="button"
            onClick={() => router.push("/account")}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-full text-white font-semibold text-[11px] tracking-[0.13em] uppercase"
            style={{
              background: "#c9977a",
              fontFamily: "var(--font-manrope)",
              boxShadow: "0 6px 24px rgba(201,151,122,0.38)",
            }}
          >
            Continue to My Account
          </motion.button>

          <motion.button
            variants={fadeUp}
            type="button"
            onClick={handleSignOut}
            className="mt-5 text-ink/45 hover:text-rose-gold transition-colors"
            style={{ fontFamily: "var(--font-manrope)", fontSize: "0.8rem" }}
          >
            Wrong email? Sign out
          </motion.button>
        </div>
      </AuthForm>

      <AuthErrorToast message={error} onDismiss={() => setError("")} />
    </>
  );
}
