"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { useCart } from "@/context/CartContext";

/**
 * Where Payfast returns the shopper after a successful payment.
 *
 * Presentation only. This page is a browser navigation the shopper can reach,
 * replay or fabricate without having paid, so it must never be treated as proof
 * of payment or used to grant anything — that is the ITN handler's job
 * (/api/payfast/notify). The copy below is deliberately careful for the same
 * reason: it confirms the payment was *submitted*, not that it cleared.
 */
export default function SuccessContent() {
  const { clearCart } = useCart();
  // Strict Mode double-invokes effects in dev; clearing twice is harmless but
  // the guard keeps the intent (exactly once, on arrival) explicit.
  const cleared = useRef(false);

  useEffect(() => {
    if (cleared.current) return;
    cleared.current = true;
    // Safe to empty the bag on arrival: the order's real record comes from the
    // ITN, so nothing depends on these items still being in localStorage. A
    // shopper who abandoned at Payfast lands on /checkout/cancelled instead and
    // keeps their bag.
    clearCart();
  }, [clearCart]);

  return (
    <section
      className="section-py section-padding min-h-screen flex items-center justify-center"
      style={{ background: "#faf7f4" }}
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-md mx-auto text-center"
      >
        <motion.div
          variants={fadeUp}
          className="w-14 h-14 rounded-full mx-auto mb-7 flex items-center justify-center"
          style={{
            background: "rgba(201,151,122,0.12)",
            border: "1px solid rgba(201,151,122,0.3)",
          }}
        >
          <Check size={22} className="text-rose-gold" />
        </motion.div>

        <motion.span variants={fadeUp} className="label-caps text-rose-gold block mb-4">
          Payment received
        </motion.span>

        <motion.h1
          variants={fadeUp}
          className="heading-display text-ink mb-5"
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(2rem, 4.5vw, 3rem)",
          }}
        >
          Thank You, Beautiful
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="text-ink/55 mb-8 text-balance"
          style={{ fontFamily: "var(--font-manrope)", fontSize: "0.9rem", lineHeight: 1.7 }}
        >
          Your payment is being confirmed. We&rsquo;ll email you as soon as it clears
          and your order is on its way.
        </motion.p>

        <motion.div variants={fadeUp}>
          <Link href="/#products" className="btn-outline">
            Continue Shopping
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
