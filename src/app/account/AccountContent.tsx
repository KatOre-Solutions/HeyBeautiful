"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Heart,
  User as UserIcon,
  Sparkles,
  Mail,
} from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { sessionExpiredLoginUrl, withFrom } from "@/lib/redirect";
import { clearSessionHint } from "@/lib/session";
import { getAuthErrorMessage, isRateLimitError } from "@/lib/auth-errors";
import { useCooldown } from "@/components/auth/useCooldown";
import AuthErrorToast from "@/components/auth/AuthErrorToast";

/** Matches the cooldown on /verify-email and /forgot-password. */
const RESEND_COOLDOWN_SECONDS = 60;

const cards = [
  {
    Icon: ShoppingBag,
    title: "My Orders",
    copy: "Track shipments and review your purchase history.",
  },
  {
    Icon: Heart,
    title: "Wishlist",
    copy: "Everything you've saved, ready when you are.",
  },
  {
    Icon: UserIcon,
    title: "Profile Settings",
    copy: "Update your details, address, and preferences.",
  },
  {
    Icon: Sparkles,
    title: "Loyalty Points",
    copy: "Earn rewards with every ritual. Glow further.",
  },
];

export default function AccountContent() {
  const router = useRouter();
  const { user, loading, signOut, sendVerification } = useAuth();
  const { clearCart } = useCart();
  const { clearWishlist } = useWishlist();
  const cooldown = useCooldown();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  const handleResendVerification = async () => {
    if (resending || cooldown.active) return;
    setError("");
    setResending(true);
    try {
      await sendVerification();
      setResent(true);
      cooldown.start(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(getAuthErrorMessage(err));
      // Already being throttled — back off rather than let them keep trying.
      if (isRateLimitError(err)) cooldown.start(RESEND_COOLDOWN_SECONDS);
    } finally {
      setResending(false);
    }
  };
  // One-shot guard: Strict Mode double-invokes effects and we never want two navigations
  // racing (matches CheckoutContent).
  const redirected = useRef(false);

  // The proxy gates this route on the presence hint alone, which proves nothing. Now that
  // Firebase has spoken, enforce the real answer: no user means the hint was stale, expired
  // or hand-set, so clear it and bounce — carrying the destination so signing back in
  // returns here. Clearing before navigating is what stops the proxy seeing the dead hint
  // on /login and bouncing them straight back.
  useEffect(() => {
    if (loading || user || redirected.current) return;
    redirected.current = true;
    clearSessionHint();
    router.replace(sessionExpiredLoginUrl("/account"));
  }, [loading, user, router]);

  const firstName = user?.displayName?.split(" ")[0] ?? "Beautiful";

  const handleSignOut = async () => {
    await signOut();
    // signOut clears the persisted cart/wishlist; these reset the in-memory contexts, which
    // live below AuthProvider and so are out of its reach.
    clearCart();
    clearWishlist();
    router.push("/");
  };

  // Avoid flashing the dashboard before auth resolves or while redirecting out.
  if (loading || !user) {
    return (
      <section
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#faf7f4" }}
      >
        <span
          className="label-caps text-rose-gold/70"
          style={{ fontSize: "11px" }}
        >
          Loading…
        </span>
      </section>
    );
  }

  return (
    <section
      className="section-py section-padding min-h-screen"
      style={{ background: "#faf7f4" }}
    >
      <div className="max-w-5xl mx-auto pt-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="text-center mb-14"
        >
          <motion.span
            variants={fadeUp}
            className="label-caps text-rose-gold block mb-4"
          >
            My Account
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="heading-display text-ink"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
            }}
          >
            Welcome, {loading ? "…" : firstName}
          </motion.h1>

          {/* Advisory, never a gate: /account stays fully usable while unverified. The copy
              says what verification is for, what it unlocks, and that they can carry on
              without it — so the reminder informs rather than nags. */}
          {user && !user.emailVerified && (
            <motion.div
              variants={fadeUp}
              className="mt-6 mx-auto max-w-md text-left px-5 py-4 rounded-2xl"
              style={{
                background: "rgba(201,151,122,0.08)",
                border: "1px solid rgba(201,151,122,0.25)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Mail size={14} className="text-rose-gold flex-shrink-0" />
                <span
                  className="text-ink font-medium"
                  style={{ fontFamily: "var(--font-manrope)", fontSize: "0.82rem" }}
                >
                  Your email isn&apos;t verified yet
                </span>
              </div>
              <p
                className="text-ink/60 leading-relaxed mb-1"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "0.78rem" }}
              >
                Verifying <span className="text-ink/80">{user.email}</span> keeps your
                account secure and is required before you can check out.
              </p>
              <p
                className="text-ink/45 leading-relaxed mb-3"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "0.75rem" }}
              >
                Everything else here works as normal in the meantime.
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending || cooldown.active}
                  className="text-rose-dark font-medium hover:opacity-70 transition-opacity disabled:opacity-50"
                  style={{ fontFamily: "var(--font-manrope)", fontSize: "0.78rem" }}
                >
                  {resending
                    ? "Sending…"
                    : resent
                      ? "Verification email sent ✓"
                      : cooldown.active
                        ? `Resend in ${cooldown.remaining}s`
                        : "Resend verification email"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(withFrom("/verify-email", "/account"))}
                  className="text-ink/50 hover:text-dusty-pink transition-colors"
                  style={{ fontFamily: "var(--font-manrope)", fontSize: "0.78rem" }}
                >
                  Already clicked the link?
                </button>
              </div>
            </motion.div>
          )}

          <motion.div
            variants={fadeUp}
            className="h-px w-16 mx-auto mt-7"
            style={{ background: "#c9977a" }}
          />
        </motion.div>

        {/* Stub cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 gap-5"
        >
          {cards.map(({ Icon, title, copy }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="glass-card p-7 cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: "rgba(201,151,122,0.1)",
                  border: "1px solid rgba(201,151,122,0.22)",
                }}
              >
                <Icon size={20} className="text-rose-gold" />
              </div>
              <h3
                className="text-ink mb-1.5"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "1.4rem",
                  fontWeight: 500,
                }}
              >
                {title}
              </h3>
              <p
                className="text-ink/50 leading-relaxed"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "0.85rem" }}
              >
                {copy}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Sign out */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-12"
        >
          <button onClick={handleSignOut} className="btn-outline">
            Sign Out
          </button>
        </motion.div>
      </div>

      <AuthErrorToast message={error} onDismiss={() => setError("")} />
    </section>
  );
}
