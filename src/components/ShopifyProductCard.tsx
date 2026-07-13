"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { fadeUp, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import type { ShopifyProduct } from "@/lib/shopify";

const ZAR = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function WishlistHeart({ product }: { product: ShopifyProduct }) {
  const { toggleItem, isWishlisted } = useWishlist();
  const wished = isWishlisted(product.id);
  const [burst, setBurst] = useState(false);

  const handleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!wished) {
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    }
    toggleItem({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image,
    });
  };

  return (
    <button
      onClick={handleWish}
      className="relative w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300"
      style={{
        background: wished ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.7)",
        backdropFilter: "blur(8px)",
        border: wished ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.6)",
      }}
      aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
    >
      <motion.div
        animate={burst ? { scale: [1, 1.55, 0.88, 1.12, 1] } : wished ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, ease: ease.cinematic }}
      >
        <Heart
          size={15}
          className={cn(
            "transition-colors duration-300",
            wished ? "fill-red-500 text-red-500" : "text-[#1e1814]/50"
          )}
        />
      </motion.div>

      {/* Burst particles */}
      <AnimatePresence>
        {burst && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-red-400"
                style={{ top: "50%", left: "50%" }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos((i * Math.PI * 2) / 6) * 20,
                  y: Math.sin((i * Math.PI * 2) / 6) * 20,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

/**
 * Shared storefront product card, built on `ShopifyProduct`.
 *
 * Used by the home page's featured grid today. It's a superset of the legacy
 * `Product`-based `ProductCard`: the detail link, star rating and explicit
 * badge render only when the matching optional fields are present, so the
 * store pages can adopt this same component once they move onto ShopifyProduct.
 */
export default function ShopifyProductCard({ product }: { product: ShopifyProduct }) {
  const [hovered, setHovered] = useState(false);
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image,
    });
  };

  return (
    <motion.div
      variants={fadeUp}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="product-card group relative"
    >
      {/* Stretched link to the product detail page — only once a slug exists.
          Sits below the interactive controls (wishlist z-20, hover button z-10,
          price button z-[2]). */}
      {product.slug && (
        <Link
          href={`/store/${product.slug}`}
          className="absolute inset-0 z-[1]"
          aria-label={`View ${product.name}`}
        />
      )}

      {/* Image container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f0ebe3]">
        {product.placeholder ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: "#f0ebe3" }}
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#c9977a]/40 flex items-center justify-center">
              <ShoppingBag size={18} className="text-[#c9977a]/40" />
            </div>
            <span className="label-caps text-[#c9977a]/40 text-[9px]">Coming Soon</span>
          </div>
        ) : (
          <motion.div
            className="absolute inset-0"
            animate={{ scale: hovered ? 1.06 : 1 }}
            transition={{ duration: 0.8, ease: ease.luxury }}
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </motion.div>
        )}

        {/* Top row — badge + wishlist. Placeholders aren't purchasable, so they
            get no badge and no wishlist control. */}
        {!product.placeholder && (
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-20">
            {product.badge ? (
              <span
                className="px-3 py-1 rounded-full text-white text-[9px] font-semibold tracking-[0.12em] uppercase"
                style={{ background: product.badgeColor ?? "#c9977a" }}
              >
                {product.badge}
              </span>
            ) : product.originalPrice != null ? (
              <span
                className="px-3 py-1 rounded-full text-white text-[9px] font-semibold tracking-[0.12em] uppercase"
                style={{ background: "#c9977a" }}
              >
                Sale
              </span>
            ) : (
              <div />
            )}
            <WishlistHeart product={product} />
          </div>
        )}

        {/* Quick-add overlay */}
        <AnimatePresence>
          {hovered && !product.placeholder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col items-center justify-end pb-6 z-10 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(30,24,20,0.5) 0%, transparent 50%)" }}
            >
              <motion.button
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 8, opacity: 0 }}
                transition={{ delay: 0.05, duration: 0.4, ease: ease.cinematic }}
                onClick={handleAddToCart}
                className="flex items-center gap-2 px-6 py-3 rounded-full text-white text-[10px] font-semibold tracking-[0.1em] uppercase transition-all pointer-events-auto"
                style={{
                  background: "rgba(201,151,122,0.95)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                }}
              >
                <ShoppingBag size={13} />
                Add to Bag
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tags row */}
        {product.tags.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 flex gap-1.5">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-white/80 text-[8px] tracking-[0.1em] uppercase"
                style={{ background: "rgba(30,24,20,0.35)", backdropFilter: "blur(4px)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-5">
        <p className="label-caps text-[#c9977a]/80 mb-1.5">{product.category}</p>
        <h3
          className={cn(
            "heading-serif text-[#1e1814] text-lg leading-tight",
            product.rating != null ? "mb-2" : "mb-4"
          )}
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          {product.name}
        </h3>

        {/* Rating — only when the product carries one */}
        {product.rating != null && (
          <div className="flex items-center gap-1.5 mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className={cn(
                    i < Math.floor(product.rating!)
                      ? "fill-[#c9977a] text-[#c9977a]"
                      : "text-[#c9977a]/30"
                  )}
                />
              ))}
            </div>
            <span className="text-[#1e1814]/50 text-[10px]">
              {product.rating}
              {product.reviews != null && ` (${product.reviews})`}
            </span>
          </div>
        )}

        {/* Price row */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span
              className="heading-serif text-xl text-[#1e1814]"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              {ZAR.format(product.price)}
            </span>
            {product.originalPrice != null && (
              <span className="text-[#1e1814]/35 text-sm line-through">
                {ZAR.format(product.originalPrice)}
              </span>
            )}
          </div>
          {!product.placeholder && (
            <button
              onClick={handleAddToCart}
              className="relative z-[2] w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              style={{ background: "rgba(201,151,122,0.1)", border: "1px solid rgba(201,151,122,0.3)" }}
              aria-label={`Add ${product.name} to bag`}
            >
              <ShoppingBag size={14} className="text-[#c9977a]" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
