"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { toAnalyticsItem, trackEcommerce } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import { sessionExpiredLoginUrl, withFrom } from "@/lib/redirect";
import { clearSessionHint } from "@/lib/session";
import AuthErrorToast from "@/components/auth/AuthErrorToast";

export default function CheckoutContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { items, totalPrice } = useCart();
  // One-shot guard: React Strict Mode double-invokes effects in dev, and we never
  // want two navigations racing.
  const redirected = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  // A line with no Shopify variant can't be bought (#92). Nothing should be able
  // to put one in the bag — bundles no longer enter it and placeholder tiles have
  // no purchase controls — so this is a guard against a future regression, not a
  // live path. Better a disabled button than a rejected checkout.
  const unpurchasable = items.some((item) => item.variantId === null);

  // Pressing Back from Shopify restores this page from the bfcache (the norm on
  // iOS Safari, common elsewhere), and React state comes back with it — including
  // `pending: true`, which is deliberately left set on the success path below.
  // Without this the shopper returns to a button stuck on "Taking you to
  // checkout…" and cannot retry short of a hard reload. The bag survives but
  // checkout doesn't, which defeats the point of keeping the bag at all.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setPending(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const handleCheckout = async () => {
    if (pending) return;
    setError("");
    setPending(true);

    // Fired before the request, not after: this is the last event the funnel gets from us.
    // Shopify owns everything past the redirect, so `purchase` is reported by Shopify's own
    // GA4 integration against the same measurement ID — see `src/lib/analytics.ts`.
    trackEcommerce(
      "begin_checkout",
      items.map((item) => toAnalyticsItem(item, item.quantity))
    );

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          // Prefill only — Shopify collects and owns the real order details.
          email: user?.email ?? undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.checkoutUrl) {
        setError(data?.message ?? "We couldn't start checkout. Please try again.");
        setPending(false);
        return;
      }

      // The bag is deliberately NOT cleared: the shopper may abandon payment or
      // press back, and losing their bag at that moment is how a sale is lost.
      // Shopify owns the order, so the bag stays until they empty it themselves.
      //
      // `pending` is deliberately NOT reset here either — the browser is still
      // navigating away, and resetting flashes the button back to its idle label.
      // `router.push` is for internal routes; this is the app's one external
      // navigation, which CSP's `form-action 'self'` does not restrict.
      window.location.assign(data.checkoutUrl);
    } catch {
      setError("We couldn't reach checkout. Check your connection and try again.");
      setPending(false);
    }
  };

  // Two client-side guards the edge proxy can't do (it only sees the presence
  // cookie): (1) stale-cookie / dead session → login; (2) unverified email →
  // verify-email, preserving the full destination (incl. query, e.g. a coupon)
  // so the user lands back here once verified. See #22.
  useEffect(() => {
    if (loading || redirected.current) return;
    // The full current URL, so a coupon or similar survives the round trip. withFrom
    // validates and encodes it.
    const dest = window.location.pathname + window.location.search;
    if (!user) {
      redirected.current = true;
      // The hint let us in but Firebase says otherwise — it was stale, expired or hand-set.
      // Clear it before navigating so the proxy doesn't bounce us back off /login.
      clearSessionHint();
      router.replace(sessionExpiredLoginUrl(dest));
    } else if (!user.emailVerified) {
      redirected.current = true;
      router.replace(withFrom("/verify-email", dest));
    }
  }, [loading, user, router]);

  if (loading || !user || !user.emailVerified) {
    return (
      <section
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#faf7f4" }}
      >
        <span className="label-caps text-rose-gold/70" style={{ fontSize: "11px" }}>
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
      <div className="max-w-2xl mx-auto pt-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <motion.span
            variants={fadeUp}
            className="label-caps text-rose-gold block mb-4"
          >
            Checkout
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="heading-display text-ink"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
            }}
          >
            Order Summary
          </motion.h1>
        </motion.div>

        {items.length === 0 ? (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <p
              className="text-ink/55 mb-6"
              style={{ fontFamily: "var(--font-manrope)", fontSize: "0.9rem" }}
            >
              Your bag is empty.
            </p>
            <Link href="/#products" className="btn-outline">
              Browse the Collection
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="glass-card p-7"
          >
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  variants={fadeUp}
                  className="flex items-center gap-4"
                >
                  <div
                    className="relative w-12 aspect-[4/5] rounded-lg overflow-hidden flex-shrink-0"
                    style={{ background: "#f0ebe3" }}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="truncate"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontSize: "1.1rem",
                        color: "#1e1814",
                        fontWeight: 500,
                      }}
                    >
                      {item.name}
                    </p>
                    <p
                      className="text-ink/50"
                      style={{ fontFamily: "var(--font-manrope)", fontSize: "0.75rem" }}
                    >
                      Qty {item.quantity}
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontSize: "1.15rem",
                      color: "#1e1814",
                    }}
                  >
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </motion.div>
              ))}
            </div>

            <motion.div
              variants={fadeUp}
              className="flex items-center justify-between mt-6 pt-6"
              style={{ borderTop: "1px solid rgba(201,151,122,0.18)" }}
            >
              <span className="label-caps text-ink/55" style={{ fontSize: "10px" }}>
                Total
              </span>
              <span
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "1.7rem",
                  color: "#1e1814",
                  fontWeight: 500,
                }}
              >
                {formatPrice(totalPrice)}
              </span>
            </motion.div>

            <motion.button
              variants={fadeUp}
              type="button"
              onClick={handleCheckout}
              disabled={pending || unpurchasable}
              whileHover={{ scale: pending ? 1 : 1.015 }}
              whileTap={{ scale: pending ? 1 : 0.98 }}
              className="btn-primary-gradient w-full py-4 mt-7 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <Lock size={13} />
              {pending ? "Taking you to checkout…" : "Proceed to Payment"}
            </motion.button>

            {unpurchasable && (
              <motion.p
                variants={fadeUp}
                role="status"
                className="mt-3 text-center text-ink/55"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "0.75rem" }}
              >
                One of these items is no longer available. Remove it to continue.
              </motion.p>
            )}

            <motion.p
              variants={fadeUp}
              className="mt-4 text-center text-ink/45"
              style={{ fontFamily: "var(--font-manrope)", fontSize: "0.7rem" }}
            >
              You’ll complete payment securely on Shopify.
            </motion.p>
          </motion.div>
        )}
      </div>

      <AuthErrorToast message={error} onDismiss={() => setError("")} />
    </section>
  );
}
