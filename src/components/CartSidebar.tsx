"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Minus, Plus, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function CartSidebar() {
  const {
    items,
    cartOpen,
    setCartOpen,
    removeItem,
    updateQuantity,
    itemCount,
    totalPrice,
  } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handleCheckout = () => {
    setCartOpen(false);
    if (!user) {
      router.push("/login?from=checkout");
    } else {
      router.push("/checkout");
    }
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60]"
            style={{
              background: "rgba(30,24,20,0.25)",
              backdropFilter: "blur(5px)",
              WebkitBackdropFilter: "blur(5px)",
            }}
            onClick={() => setCartOpen(false)}
          />

          {/* Sidebar panel */}
          <motion.div
            key="cart-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-[390px] max-w-[92vw] flex flex-col"
            style={{
              background: "rgba(250, 247, 244, 0.97)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              borderLeft: "1px solid rgba(201,151,122,0.22)",
              boxShadow:
                "-20px 0 80px rgba(30,24,20,0.1), inset 1px 0 0 rgba(255,255,255,0.6)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-7 pt-7 pb-5"
              style={{ borderBottom: "1px solid rgba(201,151,122,0.14)" }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ShoppingBag size={17} className="text-[#c9977a]" />
                </motion.div>
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18, duration: 0.45 }}
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "1.4rem",
                    color: "#1e1814",
                    fontWeight: 400,
                    letterSpacing: "-0.01em",
                  }}
                >
                  My Bag
                </motion.span>
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      key="cart-count-badge"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="w-5 h-5 rounded-full text-white text-[9px] flex items-center justify-center font-bold"
                      style={{ background: "#c9977a", fontFamily: "var(--font-manrope)" }}
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setCartOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full"
                style={{
                  background: "rgba(201,151,122,0.1)",
                  border: "1px solid rgba(201,151,122,0.22)",
                }}
                aria-label="Close bag"
              >
                <X size={15} className="text-[#1e1814]/55" />
              </motion.button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center h-full py-20 px-10 text-center">
                  <motion.div
                    initial={{ scale: 0.75, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-6"
                    style={{
                      background: "rgba(201,151,122,0.09)",
                      border: "1px solid rgba(201,151,122,0.2)",
                    }}
                  >
                    <ShoppingBag size={26} className="text-[#c9977a]/40" />
                  </motion.div>
                  <motion.p
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.18, duration: 0.5 }}
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontSize: "1.35rem",
                      color: "#1e1814",
                      fontWeight: 400,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Your bag is empty
                  </motion.p>
                  <motion.button
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.24, duration: 0.5 }}
                    onClick={() => setCartOpen(false)}
                    className="mt-3 label-caps text-[#c9977a] hover:opacity-70 transition-opacity"
                    style={{ fontSize: "10px" }}
                  >
                    Discover our products →
                  </motion.button>
                </div>
              ) : (
                <div className="p-5 flex flex-col gap-3">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 24, scale: 0.96 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 24, scale: 0.94 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center gap-4 p-4 rounded-2xl"
                        style={{
                          background: "rgba(255,255,255,0.72)",
                          border: "1px solid rgba(201,151,122,0.15)",
                          boxShadow: "0 2px 14px rgba(30,24,20,0.05)",
                        }}
                      >
                        {/* Product image */}
                        <div
                          className="relative w-[60px] h-[76px] rounded-xl overflow-hidden flex-shrink-0"
                          style={{ background: "#f0ebe3" }}
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="60px"
                          />
                        </div>

                        {/* Product info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="label-caps mb-1"
                            style={{ color: "rgba(201,151,122,0.8)", fontSize: "8px" }}
                          >
                            {item.category}
                          </p>
                          <p
                            className="leading-tight mb-2 truncate"
                            style={{
                              fontFamily: "var(--font-cormorant)",
                              fontSize: "1.05rem",
                              color: "#1e1814",
                              fontWeight: 500,
                            }}
                          >
                            {item.name}
                          </p>

                          {/* Price + quantity controls */}
                          <div className="flex items-center justify-between">
                            <p
                              style={{
                                fontFamily: "var(--font-cormorant)",
                                fontSize: "1.1rem",
                                color: "#1e1814",
                                fontWeight: 400,
                              }}
                            >
                              ${(item.price * item.quantity).toFixed(0)}
                            </p>

                            <div
                              className="flex items-center gap-2 rounded-full px-1.5 py-1"
                              style={{
                                background: "rgba(201,151,122,0.08)",
                                border: "1px solid rgba(201,151,122,0.2)",
                              }}
                            >
                              <motion.button
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.85 }}
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                className="w-5 h-5 flex items-center justify-center rounded-full"
                                aria-label={`Decrease ${item.name} quantity`}
                              >
                                <Minus size={11} className="text-[#c9977a]" />
                              </motion.button>
                              <span
                                className="min-w-[14px] text-center text-[#1e1814] text-xs font-semibold"
                                style={{ fontFamily: "var(--font-manrope)" }}
                              >
                                {item.quantity}
                              </span>
                              <motion.button
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.85 }}
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                className="w-5 h-5 flex items-center justify-center rounded-full"
                                aria-label={`Increase ${item.name} quantity`}
                              >
                                <Plus size={11} className="text-[#c9977a]" />
                              </motion.button>
                            </div>
                          </div>
                        </div>

                        {/* Remove button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.88 }}
                          onClick={() => removeItem(item.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 self-start"
                          style={{
                            background: "rgba(239,68,68,0.07)",
                            border: "1px solid rgba(239,68,68,0.18)",
                          }}
                          aria-label={`Remove ${item.name} from bag`}
                        >
                          <X size={12} style={{ color: "rgba(239,68,68,0.7)" }} />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer CTA — only shown when items exist */}
            <AnimatePresence>
              {items.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="px-5 pb-6 pt-4"
                  style={{ borderTop: "1px solid rgba(201,151,122,0.14)" }}
                >
                  {/* Subtotal */}
                  <div className="flex items-center justify-between mb-4 px-1">
                    <span
                      className="label-caps text-[#1e1814]/55"
                      style={{ fontSize: "10px" }}
                    >
                      Subtotal
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontSize: "1.45rem",
                        color: "#1e1814",
                        fontWeight: 500,
                      }}
                    >
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.015, opacity: 0.92 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    className="w-full py-4 rounded-full text-white font-semibold text-[11px] tracking-[0.13em] uppercase flex items-center justify-center gap-2"
                    style={{
                      background: "#c9977a",
                      fontFamily: "var(--font-manrope)",
                      boxShadow: "0 6px 24px rgba(201,151,122,0.38)",
                    }}
                  >
                    Proceed to Checkout
                    <ArrowRight size={13} />
                  </motion.button>

                  <p
                    className="text-center mt-3 text-[#1e1814]/40"
                    style={{
                      fontFamily: "var(--font-manrope)",
                      fontSize: "0.65rem",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Secure checkout · Free shipping over $75
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
