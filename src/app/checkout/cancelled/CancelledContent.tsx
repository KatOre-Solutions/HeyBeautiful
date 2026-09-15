"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";

/**
 * Where Payfast returns a shopper who backed out of the payment page.
 *
 * The bag is deliberately left intact — the whole point of this page is that
 * nothing was charged and nothing was lost, so "Return to Checkout" picks up
 * exactly where they left off.
 */
export default function CancelledContent() {
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
        <motion.span variants={fadeUp} className="label-caps text-rose-gold block mb-4">
          Payment cancelled
        </motion.span>

        <motion.h1
          variants={fadeUp}
          className="heading-display text-ink mb-5"
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(2rem, 4.5vw, 3rem)",
          }}
        >
          No Charge Made
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="text-ink/55 mb-8 text-balance"
          style={{ fontFamily: "var(--font-manrope)", fontSize: "0.9rem", lineHeight: 1.7 }}
        >
          Your payment was cancelled and nothing was taken. Your bag is exactly as
          you left it, whenever you&rsquo;re ready.
        </motion.p>

        <motion.div variants={fadeUp} className="flex flex-wrap gap-3 justify-center">
          <Link href="/checkout" className="btn-luxury btn-primary">
            Return to Checkout
          </Link>
          <Link href="/#products" className="btn-outline">
            Keep Browsing
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
