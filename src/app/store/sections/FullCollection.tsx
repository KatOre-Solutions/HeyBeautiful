"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer, staggerContainerSlow } from "@/lib/motion";
import ShopifyProductCard from "@/components/ShopifyProductCard";
import type { ShopifyProduct } from "@/lib/product";
import { ALL_CATEGORIES } from "./ShopByCategory";

/**
 * The browsable catalogue, four-up — the counterpart to the three-up showcase
 * above. This is the only grid the category filter touches.
 *
 * The grid is deliberately NOT keyed on `activeCategory`. Keying it would
 * remount every card on each filter change; reconciling on `product.id` instead
 * keeps the cards that survive a filter mounted, and newly matched ones still
 * animate in because they mount under a container already holding
 * `initial="hidden"`.
 */

/**
 * Anchor the category tiles scroll to. An id rather than a forwarded ref keeps
 * this component a plain function and makes the collection linkable as
 * `/store#collection`.
 */
export const COLLECTION_ID = "collection";

export default function FullCollection({
  products,
  activeCategory,
  onClear,
}: {
  products: ShopifyProduct[];
  activeCategory: string;
  onClear: () => void;
}) {
  const filtered =
    activeCategory === ALL_CATEGORIES
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <section
      id={COLLECTION_ID}
      className="section-padding pt-16 md:pt-24 pb-20 md:pb-28 bg-cream"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap items-end justify-between gap-4 mb-10 md:mb-12"
        >
          <div>
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
              <div className="h-px w-10 bg-rose-gold" />
              <span className="label-caps text-rose-gold">
                {activeCategory === ALL_CATEGORIES ? "Everything" : activeCategory}
              </span>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="heading-display text-ink"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(2rem, 4vw, 3.25rem)",
              }}
            >
              The full collection
            </motion.h2>
          </div>

          <motion.div variants={fadeUp} className="flex items-center gap-4">
            <span className="label-caps text-ink/40 text-[10px]">
              {filtered.length} {filtered.length === 1 ? "product" : "products"}
            </span>
            {activeCategory !== ALL_CATEGORIES && (
              <button
                onClick={onClear}
                className="label-caps text-[10px] text-rose-gold underline underline-offset-4 hover:text-rose-dark transition-colors duration-300"
              >
                Clear filter
              </button>
            )}
          </motion.div>
        </motion.div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-ink/55" style={{ fontSize: "0.95rem", fontWeight: 300 }}>
              {products.length === 0
                ? "Our collection is being restocked — check back shortly."
                : "Nothing in this category just yet."}
            </p>
            {products.length > 0 && (
              <button
                onClick={onClear}
                className="btn-luxury btn-outline mt-6"
              >
                View all products
              </button>
            )}
          </div>
        ) : (
          <motion.div
            variants={staggerContainerSlow}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {/* The first row is above the fold on desktop (lg:grid-cols-4); on
                mobile grid-cols-2 makes it the first two rows, also at the fold.
                Eager-load those so the LCP image isn't lazy; the rest stay lazy. */}
            {filtered.map((product, index) => (
              <ShopifyProductCard
                key={product.id}
                product={product}
                variant="store"
                priority={index < 4}
              />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
