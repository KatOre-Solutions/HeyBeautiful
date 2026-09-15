"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Lock } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import { sessionExpiredLoginUrl, withFrom } from "@/lib/redirect";
import { clearSessionHint } from "@/lib/session";

export default function CheckoutContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { items, totalPrice } = useCart();
  // One-shot guard: React Strict Mode double-invokes effects in dev, and we never
  // want two navigations racing.
  const redirected = useRef(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  /**
   * Hands the bag to Payfast.
   *
   * We send ids and quantities only — the server prices the cart from Shopify
   * and signs the result, because the cart lives in localStorage and any price
   * originating here is shopper-controlled (see /api/payfast/initiate).
   *
   * The redirect is a real form POST rather than `location.href`: Payfast's
   * custom integration expects the signed fields as form-encoded POST data, and
   * a GET with them in the query string is rejected. `paying` is never reset on
   * the success path — the browser is leaving, and clearing it would flash the
   * button back to its idle state mid-navigation.
   */
  const payWithPayfast = useCallback(async () => {
    setPaying(true);
    setPayError(null);

    try {
      const response = await fetch("/api/payfast/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ id, quantity }) => ({ id, quantity })),
          email: user?.email ?? undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // The route returns shopper-facing copy for the cases a shopper can act
        // on (out of stock, bundle in bag); anything else gets a generic line.
        setPayError(
          typeof data?.error === "string"
            ? data.error
            : "We couldn't start your payment. Please try again."
        );
        setPaying(false);
        return;
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.url;
      for (const [name, value] of Object.entries(data.fields as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch {
      setPayError("We couldn't reach the payment service. Please try again.");
      setPaying(false);
    }
  }, [items, user]);

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

            <motion.div variants={fadeUp} className="mt-7">
              <button
                type="button"
                onClick={payWithPayfast}
                disabled={paying}
                className="btn-luxury btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {paying ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Redirecting…
                  </>
                ) : (
                  <>
                    <Lock size={13} />
                    Pay {formatPrice(totalPrice)}
                  </>
                )}
              </button>

              {payError && (
                <p
                  role="alert"
                  className="mt-3 text-center text-blush-600"
                  style={{ fontFamily: "var(--font-manrope)", fontSize: "0.8rem" }}
                >
                  {payError}
                </p>
              )}

              <p
                className="mt-3 flex items-center justify-center gap-1.5 text-ink/45"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "0.7rem" }}
              >
                <Lock size={10} className="text-rose-gold" />
                Secured by Payfast — you&rsquo;ll complete payment on their site.
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
