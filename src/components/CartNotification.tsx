"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";
import { useCart, type CartProduct } from "@/context/CartContext";

const VISIBLE_MS = 3500;

export default function CartNotification() {
  const { lastAdded, clearLastAdded, setCartOpen } = useCart();
  const [shown, setShown] = useState<CartProduct | null>(null);

  // Surface each new `lastAdded` and auto-dismiss after a delay. The `key`
  // changes on every add (even for the same product) so the timer restarts.
  useEffect(() => {
    if (!lastAdded) return;
    setShown(lastAdded.product);
    const timer = setTimeout(() => {
      setShown(null);
      clearLastAdded();
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [lastAdded, clearLastAdded]);

  const dismiss = () => {
    setShown(null);
    clearLastAdded();
  };

  const openBag = () => {
    dismiss();
    setCartOpen(true);
  };

  return (
    <div className="fixed top-24 right-4 md:right-8 z-[80] pointer-events-none">
      <AnimatePresence>
        {shown && (
          <motion.div
            key={lastAdded?.key ?? "cart-notification"}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto w-[300px] rounded-2xl overflow-hidden"
            style={{
              background: "rgba(250, 247, 244, 0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(201,151,122,0.25)",
              boxShadow:
                "0 12px 40px rgba(30,24,20,0.14), inset 0 1px 0 rgba(255,255,255,0.6)",
            }}
          >
            <div className="px-4 py-3.5">
              {/* Top row — confirmation + dismiss */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.1,
                      duration: 0.4,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "#c9977a" }}
                  >
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </motion.div>
                  <span
                    className="label-caps text-[#c9977a]"
                    style={{ fontSize: "9px" }}
                  >
                    Added to your bag
                  </span>
                </div>
                <button
                  onClick={dismiss}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#1e1814]/5 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X size={12} className="text-[#1e1814]/40" />
                </button>
              </div>

              {/* Product row */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="relative w-11 h-14 rounded-lg overflow-hidden flex-shrink-0"
                  style={{ background: "#f0ebe3" }}
                >
                  <Image
                    src={shown.image}
                    alt={shown.name}
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="leading-tight truncate"
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontSize: "1rem",
                      color: "#1e1814",
                      fontWeight: 500,
                    }}
                  >
                    {shown.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-manrope)",
                      fontSize: "0.75rem",
                      color: "rgba(30,24,20,0.5)",
                    }}
                  >
                    ${shown.price}
                  </p>
                </div>
              </div>

              {/* View bag CTA */}
              <button
                onClick={openBag}
                className="w-full py-2.5 rounded-full flex items-center justify-center gap-1.5 transition-all hover:opacity-85"
                style={{
                  background: "rgba(201,151,122,0.12)",
                  border: "1px solid rgba(201,151,122,0.3)",
                }}
              >
                <span
                  className="label-caps text-[#c9977a]"
                  style={{ fontSize: "9px" }}
                >
                  View Bag
                </span>
                <ArrowRight size={11} className="text-[#c9977a]" />
              </button>
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
              key={`${lastAdded?.key ?? "bar"}-progress`}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: VISIBLE_MS / 1000, ease: "linear" }}
              className="h-0.5 origin-left"
              style={{ background: "rgba(201,151,122,0.5)" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
