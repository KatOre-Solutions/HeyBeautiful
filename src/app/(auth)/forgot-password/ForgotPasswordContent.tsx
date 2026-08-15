"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { fadeUp, scaleIn } from "@/lib/motion";
import { useAuth } from "@/context/AuthContext";
import AuthForm from "@/components/auth/AuthForm";
import FloatingInput from "@/components/auth/FloatingInput";
import AuthErrorToast from "@/components/auth/AuthErrorToast";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { DEFAULT_DESTINATION, resolveDestination, withFrom } from "@/lib/redirect";
import { isPlausibleEmail } from "@/lib/email";
import { useCooldown } from "@/components/auth/useCooldown";

/** Matches the verification resend cooldown, so the two flows behave the same way. */
const RESEND_COOLDOWN_SECONDS = 60;

function ForgotPassword() {
  const params = useSearchParams();
  // This route renders outside the (card) group, so AuthCard — and the lastLoginFrom it
  // owns — unmounts on the way in. The URL is the only thing that survives the round trip,
  // which is why the destination has to travel as ?from= rather than in context.
  const fromParam = params.get("from");
  const destination =
    fromParam !== null ? resolveDestination(fromParam) : DEFAULT_DESTINATION;
  const backToSignIn = withFrom(
    "/login",
    destination === DEFAULT_DESTINATION ? null : destination
  );

  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const cooldown = useCooldown();

  const requestReset = async () => {
    setError("");
    setLoading(true);
    try {
      // Resolves even when no account exists — see resetPassword in AuthContext. So the
      // success path here says nothing about whether the address is registered.
      await resetPassword(email);
      setSent(true);
      cooldown.start(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      // Only operational failures reach here (network, rate limiting). None of them depend
      // on whether the account exists, so showing them leaks nothing.
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    // Catch a malformed address before spending a request on it — and before Firebase can
    // answer with anything at all.
    if (!isPlausibleEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    await requestReset();
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
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-soft-tan border border-dusty-pink/25">
                <CheckCircle size={32} className="text-dusty-pink" />
              </div>
              <h3
                className="text-ink mb-2"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "1.6rem",
                  fontWeight: 400,
                }}
              >
                Check your inbox
              </h3>
              {/* Deliberately conditional wording: "if an account exists". Confirming that
                  a link *was* sent would tell anyone who typed an address whether that
                  person has an account here. */}
              <p
                className="text-ink/55 leading-relaxed mb-4 max-w-xs"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "0.85rem" }}
              >
                If an account exists for{" "}
                <span className="text-ink font-medium">{email}</span>, you&apos;ll receive
                instructions for resetting your password shortly.
              </p>
              {/* Covers the provider-only case without looking anything up: we can't ask
                  which sign-in methods an account has without creating the same oracle. */}
              <p
                className="text-ink/45 leading-relaxed mb-6 max-w-xs"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "0.78rem" }}
              >
                If you normally sign in with Google or Apple, use that button on the sign-in
                page instead — you may not have a password to reset.
              </p>

              <div className="w-full flex flex-col gap-2.5 max-w-xs">
                <Link href={backToSignIn} className="btn-outline w-full">
                  Back to Sign In
                </Link>
                <button
                  type="button"
                  onClick={requestReset}
                  disabled={loading || cooldown.active}
                  className="text-ink/45 hover:text-dusty-pink transition-colors disabled:opacity-60 disabled:hover:text-ink/45 py-1"
                  style={{ fontFamily: "var(--font-manrope)", fontSize: "0.78rem" }}
                >
                  {loading
                    ? "Sending…"
                    : cooldown.active
                      ? `Didn't get it? Resend in ${cooldown.remaining}s`
                      : "Didn't get it? Send again"}
                </button>
              </div>
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                error={emailError}
                autoComplete="email"
                required
              />

              <motion.button
                variants={fadeUp}
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.015 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="btn-primary-gradient w-full py-4 disabled:opacity-70"
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </motion.button>

              <motion.div variants={fadeUp} className="text-center">
                <Link
                  href={backToSignIn}
                  className="text-ink/50 hover:text-dusty-pink transition-colors"
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

export default function ForgotPasswordContent() {
  // useSearchParams requires a Suspense boundary (matches LoginContent).
  return (
    <Suspense fallback={null}>
      <ForgotPassword />
    </Suspense>
  );
}
