"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag } from "lucide-react";
import { fadeUp, staggerContainer, staggerContainerSlow } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/context/WishlistContext";
import type { ShopifyProduct } from "@/lib/shopify";

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
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Heart
          size={15}
          className={cn(
            "transition-colors duration-300",
            wished ? "fill-red-500 text-red-500" : "text-[#1e1814]/50"
          )}
        />
      </motion.div>

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

function ProductCard({ product }: { product: ShopifyProduct }) {
  const [hovered, setHovered] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const formatter = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: product.currencyCode || "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <motion.div
      variants={fadeUp}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="product-card group"
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f0ebe3]">
        <motion.div
          className="absolute inset-0"
          animate={{ scale: hovered ? 1.06 : 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </motion.div>

        {/* Top row — sale badge + wishlist */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-20">
          {product.originalPrice != null ? (
            <span className="px-3 py-1 rounded-full text-white text-[9px] font-semibold tracking-[0.12em] uppercase" style={{ background: "#c9977a" }}>
              Sale
            </span>
          ) : (
            <div />
          )}
          <WishlistHeart product={product} />
        </div>

        {/* Quick-add overlay */}
        <AnimatePresence>
          {hovered && (
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
                transition={{ delay: 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onClick={handleAddToCart}
                className="flex items-center gap-2 px-6 py-3 rounded-full text-white text-[10px] font-semibold tracking-[0.1em] uppercase transition-all pointer-events-auto"
                style={{
                  background: addedToCart ? "rgba(67,97,238,0.9)" : "rgba(201,151,122,0.95)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                }}
              >
                <ShoppingBag size={13} />
                {addedToCart ? "Added!" : "Add to Bag"}
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
          className="heading-serif text-[#1e1814] mb-4 text-lg leading-tight"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          {product.name}
        </h3>

        {/* Price row */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span
              className="heading-serif text-xl text-[#1e1814]"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              {formatter.format(product.price)}
            </span>
            {product.originalPrice != null && (
              <span className="text-[#1e1814]/35 text-sm line-through">
                {formatter.format(product.originalPrice)}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{ background: "rgba(201,151,122,0.1)", border: "1px solid rgba(201,151,122,0.3)" }}
          >
            <ShoppingBag size={14} className="text-[#c9977a]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function FeaturedProducts({ products }: { products: ShopifyProduct[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="products" ref={ref} className="section-py section-padding" style={{ background: "#faf7f4" }}>
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-10 bg-[#c9977a]" />
            <span className="label-caps text-[#c9977a]">The Collection</span>
            <div className="h-px w-10 bg-[#c9977a]" />
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="heading-display text-[#1e1814]"
            style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
          >
            Your Ritual, Elevated
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mt-4 text-[#1e1814]/55 max-w-md mx-auto leading-relaxed"
            style={{ fontSize: "0.95rem", fontWeight: 300 }}
          >
            Each formula crafted to complement your life — not complicate it.
          </motion.p>
        </motion.div>

        {/* Products grid */}
        <motion.div
          variants={staggerContainerSlow}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>

        {/* View all CTA */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ delay: 0.6 }}
          className="flex justify-center mt-12"
        >
          <a href="#" className="btn-outline">
            View Full Collection
          </a>
        </motion.div>
      </div>
    </section>
  );
}
