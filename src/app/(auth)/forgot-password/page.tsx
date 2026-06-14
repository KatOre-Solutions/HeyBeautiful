"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { fadeUp, scaleIn } from "@/lib/motion";
import { useAuth } from "@/context/AuthContext";
import AuthForm from "@/components/auth/AuthForm";
import FloatingInput from "@/components/auth/FloatingInput";
import AuthErrorToast, { getAuthErrorMessage } from "@/components/auth/AuthErrorToast";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthForm
        title="Reset Password"
        subtitle="We'll send a reset link to your inbox"
      >
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="success"
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center text-center py-4"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                style={{
                  background: "rgba(201,151,122,0.1)",
                  border: "1px solid rgba(201,151,122,0.25)",
                }}
              >
                <CheckCircle size={32} className="text-[#c9977a]" />
              </div>
              <h3
                className="text-[#1e1814] mb-2"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "1.6rem",
                  fontWeight: 400,
                }}
              >
                Check your inbox
              </h3>
              <p
                className="text-[#1e1814]/55 leading-relaxed mb-7 max-w-xs"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "0.85rem" }}
              >
                A password reset link has been sent to{" "}
                <span className="text-[#1e1814] font-medium">{email}</span>.
              </p>
              <Link href="/login" className="btn-outline">
                Back to Sign In
              </Link>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              <FloatingInput
                id="email"
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <motion.button
                variants={fadeUp}
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.015 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-4 rounded-full text-white font-semibold text-[11px] tracking-[0.13em] uppercase disabled:opacity-70"
                style={{
                  background: "#c9977a",
                  fontFamily: "var(--font-manrope)",
                  boxShadow: "0 6px 24px rgba(201,151,122,0.38)",
                }}
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </motion.button>

              <motion.div variants={fadeUp} className="text-center">
                <Link
                  href="/login"
                  className="text-[#1e1814]/50 hover:text-[#c9977a] transition-colors"
                  style={{ fontFamily: "var(--font-manrope)", fontSize: "0.82rem" }}
                >
                  ← Back to Sign In
                </Link>
              </motion.div>
            </motion.form>
          )}
        </AnimatePresence>
      </AuthForm>

      <AuthErrorToast message={error} onDismiss={() => setError("")} />
    </>
  );
}
