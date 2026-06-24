"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ShoppingBag } from "lucide-react";
import { useWishlist, type WishlistProduct } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import SideDrawer from "@/components/SideDrawer";
import { ease } from "@/lib/motion";

const ZAR = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function WishlistSidebar() {
  const { items, wishlistOpen, setWishlistOpen, toggleItem, clearWishlist } =
    useWishlist();
  const { addItem, setCartOpen } = useCart();

  // Move every saved item into the bag (and out of the wishlist), then hand
  // off to the cart.
  const handleShopAll = () => {
    items.forEach((item) => addItem(item));
    clearWishlist();
    setWishlistOpen(false);
    setCartOpen(true);
  };

  // Move a single saved item into the bag and remove it from the wishlist.
  // No auto-open of the cart — the "Added to bag" toast confirms it (matches
  // the product-card add behaviour).
  const handleMoveToBag = (item: WishlistProduct) => {
    addItem(item);
    toggleItem(item);
  };

  return (
    <SideDrawer
      isOpen={wishlistOpen}
      onClose={() => setWishlistOpen(false)}
      icon={<Heart size={17} className="text-rose-gold" fill="#c9977a" />}
      title="My Wishlist"
      count={items.length}
      closeLabel="Close wishlist"
      footer={
        items.length > 0 ? (
          <motion.button
            whileHover={{ scale: 1.015, opacity: 0.92 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleShopAll}
            className="w-full py-4 rounded-full text-white font-semibold text-[11px] tracking-[0.13em] uppercase"
            style={{
              background: "#c9977a",
              fontFamily: "var(--font-manrope)",
              boxShadow: "0 6px 24px rgba(201,151,122,0.38)",
            }}
          >
            Shop All Saved Items
          </motion.button>
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
            <Heart size={26} className="text-rose-gold/40" />
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
            Your wishlist is empty
          </motion.p>
          <motion.p
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.24, duration: 0.5 }}
            className="mt-2.5 leading-relaxed"
            style={{
              fontFamily: "var(--font-manrope)",
              fontSize: "0.8rem",
              color: "rgba(30,24,20,0.45)",
              fontWeight: 300,
            }}
          >
            Tap the heart on any product to save it here.
          </motion.p>
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
                  <p
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontSize: "1.1rem",
                      color: "#1e1814",
                      fontWeight: 400,
                    }}
                  >
                    {ZAR.format(item.price)}
                  </p>
                </div>

                {/* Actions — move to bag / remove */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.88 }}
                    onClick={() => handleMoveToBag(item)}
                    className="w-8 h-8 flex items-center justify-center rounded-full"
                    style={{
                      background: "rgba(201,151,122,0.1)",
                      border: "1px solid rgba(201,151,122,0.25)",
                    }}
                    aria-label={`Move ${item.name} to bag`}
                  >
                    <ShoppingBag size={12} className="text-rose-gold" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.88 }}
                    onClick={() => toggleItem(item)}
                    className="w-8 h-8 flex items-center justify-center rounded-full"
                    style={{
                      background: "rgba(239,68,68,0.07)",
                      border: "1px solid rgba(239,68,68,0.18)",
                    }}
                    aria-label={`Remove ${item.name} from wishlist`}
                  >
                    <X size={12} style={{ color: "rgba(239,68,68,0.7)" }} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </SideDrawer>
  );
}
