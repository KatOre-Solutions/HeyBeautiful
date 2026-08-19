"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle } from "lucide-react";
import { fadeUp } from "@/lib/motion";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import {
  DEFAULT_DESTINATION,
  requiresVerification,
  resolveDestination,
  withFrom,
} from "@/lib/redirect";
import AuthForm from "@/components/auth/AuthForm";
import AuthErrorToast from "@/components/auth/AuthErrorToast";
import { getAuthErrorMessage, isRateLimitError } from "@/lib/auth-errors";
import { useCooldown } from "@/components/auth/useCooldown";

// How often to re-check emailVerified while the page is open and visible. Firebase has no
// live listener for verification, so we poll (and also re-check when the tab regains focus).
const VERIFY_POLL_INTERVAL_MS = 3000;

/**
 * How long to keep polling automatically. Someone who opens this page and wanders off
 * shouldn't leave a tab firing a request every 3s all afternoon — that's thousands of
 * pointless calls and a good way to get rate-limited. After this we stop and hand control
 * back to the user, who can check on demand; returning to the tab still triggers a check.
 */
const VERIFY_POLL_MAX_MS = 15 * 60 * 1000;

/** Firebase throttles verification sends, so match it rather than discovering it. */
const RESEND_COOLDOWN_SECONDS = 60;

/** How long the "sent" confirmation stays up before the cooldown counter takes over. */
const RESENT_NOTICE_MS = 4000;

function VerifyEmail() {
  const router = useRouter();
  const params = useSearchParams();
  // Where to send the user once verified — the checkout guard passes ?from=/checkout…;
  // resolveDestination falls back to /account and blocks open redirects.
  const dest = resolveDestination(params.get("from"));
  // A destination that requires verification would just bounce off its own guard back to
  // this page while unverified — and the verified case is already handled by the
  // auto-redirect below. So the manual CTA only makes sense for advisory destinations.
  const showManualContinue = !requiresVerification(dest);
  // `dest` is whatever survived resolveDestination — /verify-email?from=%2Fstore is
  // reachable from sign-up — so the label has to follow it rather than always claiming
  // the account page while navigating somewhere else.
  const continueLabel =
    dest === DEFAULT_DESTINATION ? "Continue to My Account" : "Continue";
  // Sign-up sets `sent=0` when the account was created but the verification email couldn't
  // be sent. The account is real and the session is live — only the email is missing — so
  // say so plainly instead of claiming we sent something we didn't.
  const initialSendFailed = params.get("sent") === "0";
  const { user, loading, sendVerification, reloadUser, signOut } = useAuth();
  const { clearCart } = useCart();
  const { clearWishlist } = useWishlist();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const cooldown = useCooldown();
  const [checking, setChecking] = useState(false);
  const [checkedNotVerified, setCheckedNotVerified] = useState(false);
  // Flipped when the automatic poll gives up, swapping it for a user-driven check.
  const [pollExhausted, setPollExhausted] = useState(false);
  const [error, setError] = useState("");
  // One-shot navigation guard — Strict Mode double-invokes effects, and the
  // mount check / poll / focus handler could otherwise each fire a navigation.
  const redirected = useRef(false);
  // Read inside the interval so the deadline survives re-renders without re-running the
  // polling effect (which would restart the window each time).
  const pollDeadline = useRef(0);
  const exhausted = useRef(false);

  const navOnce = useCallback(
    (path: string) => {
      if (redirected.current) return;
      redirected.current = true;
      router.replace(path);
    },
    [router]
  );

  // No session (e.g. opened directly) — nothing to verify, send to login, carrying the
  // destination so signing in doesn't lose where they were headed.
  useEffect(() => {
    if (!loading && !user) navOnce(withFrom("/login", dest));
  }, [loading, user, navOnce, dest]);

  // Auto-detect verification: already-verified on mount, a background poll, or the user
  // returning to this tab after clicking the email link. Because emailVerified isn't live,
  // each trigger calls reloadUser() (which coalesces concurrent calls and never throws).
  //
  // The interval only runs while the tab is visible — a hidden tab can't act on the result
  // and browsers throttle its timers anyway — and only until the deadline. Focus and
  // visibility checks stay wired up past the deadline, because those are the user showing
  // up, which is exactly when a check is worth making.
  useEffect(() => {
    if (loading || !user) return;
    if (user.emailVerified) {
      navOnce(dest);
      return;
    }

    if (pollDeadline.current === 0) {
      pollDeadline.current = Date.now() + VERIFY_POLL_MAX_MS;
    }

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    const stop = () => {
      if (interval !== undefined) {
        clearInterval(interval);
        interval = undefined;
      }
    };

    const check = async () => {
      if (cancelled) return;
      const verified = await reloadUser();
      if (cancelled || !verified) return;
      // Stop before navigating so no further reload fires in the gap before unmount.
      stop();
      navOnce(dest);
    };

    const giveUp = () => {
      stop();
      exhausted.current = true;
      setPollExhausted(true);
    };

    const start = () => {
      if (interval !== undefined || cancelled || exhausted.current) return;
      // The deadline can pass while the tab is hidden and the interval stopped. Catching it
      // here means returning to the tab shows the manual control straight away rather than
      // after one more poll.
      if (Date.now() >= pollDeadline.current) {
        giveUp();
        return;
      }
      interval = setInterval(() => {
        if (Date.now() >= pollDeadline.current) {
          giveUp();
          return;
        }
        void check();
      }, VERIFY_POLL_INTERVAL_MS);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void check();
        start();
      } else {
        stop();
      }
    };
    const onFocus = () => void check();

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [loading, user, reloadUser, navOnce, dest]);

  // Same shape for the "sent" confirmation, so an unmount mid-notice leaves nothing behind.
  useEffect(() => {
    if (!resent) return;
    const id = setTimeout(() => setResent(false), RESENT_NOTICE_MS);
    return () => clearTimeout(id);
  }, [resent]);

  const handleResend = async () => {
    // Guards a double-click mid-request as well as the cooldown window.
    if (resending || cooldown.active) return;
    setError("");
    setResending(true);
    try {
      await sendVerification();
      setResent(true);
      cooldown.start(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(getAuthErrorMessage(err));
      // Firebase is already refusing — start the cooldown anyway so we stop hammering it.
      // A failure for any other reason leaves the button live for an immediate retry.
      if (isRateLimitError(err)) cooldown.start(RESEND_COOLDOWN_SECONDS);
    } finally {
      setResending(false);
    }
  };

  // Manual replacement for the poll once it has given up.
  const handleCheckNow = async () => {
    if (checking) return;
    setChecking(true);
    setCheckedNotVerified(false);
    const verified = await reloadUser();
    setChecking(false);
    if (verified) navOnce(dest);
    else setCheckedNotVerified(true);
  };

  const handleSignOut = async () => {
    await signOut();
    // signOut clears the persisted cart/wishlist; these reset the in-memory contexts, which
    // live below AuthProvider and so are out of its reach.
    clearCart();
    clearWishlist();
    // "Wrong email?" means a different account, not a different destination.
    router.push(withFrom("/login", dest));
  };

  // Don't flash the verify UI before auth resolves or while redirecting a
  // sessionless visitor out (this route is intentionally not proxy-gated).
  if (loading || !user) {
    return (
      <div className="w-full max-w-sm flex items-center justify-center">
        <span className="label-caps text-dusty-pink/70" style={{ fontSize: "11px" }}>
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
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-soft-tan border border-dusty-pink/25"
          >
            <Mail size={40} className="text-dusty-pink" />
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="text-ink/55"
            style={{ fontFamily: "var(--font-manrope)", fontSize: "0.88rem" }}
          >
            {initialSendFailed && !resent
              ? "Your account is ready, but we couldn't send the verification email to:"
              : "We've sent a verification link to:"}
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
            {initialSendFailed && !resent
              ? "Your account was created successfully — nothing is lost. Tap resend below to send the link."
              : "Click the link in your email to activate your account and start shopping."}
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
                  <CheckCircle size={16} className="text-dusty-pink" />
                  <span
                    className="text-dusty-pink"
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
                  disabled={resending || cooldown.active}
                  className="btn-outline w-full disabled:opacity-60"
                >
                  {resending
                    ? "Sending…"
                    : cooldown.active
                      ? `Resend available in ${cooldown.remaining}s`
                      : "Resend Verification Email"}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Automatic checking has stopped — hand the user an explicit way to re-check. */}
          {pollExhausted && (
            <motion.div variants={fadeUp} className="w-full mb-3">
              <p
                className="text-ink/45 leading-relaxed mb-3"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "0.75rem" }}
              >
                {checkedNotVerified
                  ? "Still not verified. Check your inbox, then try again."
                  : "We've stopped checking automatically. Once you've clicked the link, check again."}
              </p>
              <button
                type="button"
                onClick={handleCheckNow}
                disabled={checking}
                className="btn-outline w-full disabled:opacity-60"
              >
                {checking ? "Checking…" : "I've verified — check again"}
              </button>
            </motion.div>
          )}

          {showManualContinue && (
            <motion.button
              variants={fadeUp}
              type="button"
              onClick={() => navOnce(dest)}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary-gradient w-full py-4"
            >
              {continueLabel}
            </motion.button>
          )}

          <motion.button
            variants={fadeUp}
            type="button"
            onClick={handleSignOut}
            className="mt-5 text-ink/45 hover:text-dusty-pink transition-colors"
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

export default function VerifyEmailContent() {
  // useSearchParams requires a Suspense boundary (matches LoginContent).
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}
