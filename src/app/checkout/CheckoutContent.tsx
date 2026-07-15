"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";

export default function CheckoutContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { items, totalPrice } = useCart();

  // Same stale-cookie guard as the account page — proxy only checks cookie presence.
  useEffect(() => {
    if (!loading && !user) router.replace("/login?from=checkout");
  }, [loading, user, router]);

  if (loading || !user) {
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

            {/* Payment is not wired up yet — honest placeholder. */}
            <motion.div
              variants={fadeUp}
              className="mt-7 flex items-center justify-center gap-2 py-4 rounded-full"
              style={{
                background: "rgba(201,151,122,0.1)",
                border: "1px dashed rgba(201,151,122,0.35)",
              }}
            >
              <Lock size={13} className="text-rose-gold" />
              <span
                className="text-ink/65"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "0.8rem" }}
              >
                Secure payment coming soon
              </span>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
