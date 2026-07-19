"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Minus, Plus, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import SideDrawer from "@/components/SideDrawer";
import { ease } from "@/lib/motion";
import { formatPrice } from "@/lib/format";

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
    <SideDrawer
      isOpen={cartOpen}
      onClose={() => setCartOpen(false)}
      icon={<ShoppingBag size={17} className="text-rose-gold" />}
      title="My Bag"
      count={itemCount}
      closeLabel="Close bag"
      footer={
        items.length > 0 ? (
          <>
            {/* Subtotal */}
            <div className="flex items-center justify-between mb-4 px-1">
              <span
                className="label-caps text-ink/55"
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
                {formatPrice(totalPrice)}
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
              className="text-center mt-3 text-ink/40"
              style={{
                fontFamily: "var(--font-manrope)",
                fontSize: "0.65rem",
                letterSpacing: "0.04em",
              }}
            >
              Secure checkout · Free shipping over $75
            </p>
          </>
        ) : null
      }
    >
      {items.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center h-full py-20 px-10 text-center">
          <motion.div
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: ease.cinematic }}
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-6"
            style={{
              background: "rgba(201,151,122,0.09)",
              border: "1px solid rgba(201,151,122,0.2)",
            }}
          >
            <ShoppingBag size={26} className="text-rose-gold/40" />
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
            className="mt-3 label-caps text-rose-gold hover:opacity-70 transition-opacity"
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
                transition={{ duration: 0.4, ease: ease.cinematic }}
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.72)",
                  border: "1px solid rgba(201,151,122,0.15)",
                  boxShadow: "0 2px 14px rgba(30,24,20,0.05)",
                }}
              >
                {/* Product image */}
                <div
                  className="relative w-[60px] aspect-[4/5] rounded-xl overflow-hidden flex-shrink-0"
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
                      {formatPrice(item.price * item.quantity)}
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
                        <Minus size={11} className="text-rose-gold" />
                      </motion.button>
                      <span
                        className="min-w-[14px] text-center text-ink text-xs font-semibold"
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
                        <Plus size={11} className="text-rose-gold" />
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
    </SideDrawer>
  );
}
