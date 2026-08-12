"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { fadeUp, staggerContainer, staggerContainerSlow } from "@/lib/motion";
import ShopifyProductCard from "@/components/ShopifyProductCard";
import type { ShopifyProduct } from "@/lib/product";

/**
 * Curated shelf, three-up. Intentionally NOT affected by the category filter —
 * it's a merchandising decision made in Shopify (the `featured` tag), so letting
 * a category click reshuffle it would turn a considered selection into just
 * another view of the grid below.
 *
 * `variant="showcase"` gives these cards the wider column hint and larger type;
 * no `priority` — the hero image above is this page's LCP.
 */
export default function FeaturedShowcase({
  products,
}: {
  products: ShopifyProduct[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  if (products.length === 0) return null;

  return (
    <section ref={ref} className="section-padding pt-16 md:pt-24" style={{ background: "#faf7f4" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mb-12 md:mb-14"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
            <div className="h-px w-10 bg-[#c9977a]" />
            <span className="label-caps text-[#c9977a]">Loved most</span>
          </motion.div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <motion.h2
              variants={fadeUp}
              className="heading-display text-ink"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(2rem, 4vw, 3.25rem)",
              }}
            >
              The ones she keeps reordering
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="text-ink/55 max-w-sm leading-relaxed"
              style={{ fontSize: "0.9375rem", fontWeight: 300 }}
            >
              A small edit of the formulas that earn their place in a routine and
              stay there.
            </motion.p>
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainerSlow}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
        >
          {products.map((product) => (
            <ShopifyProductCard key={product.id} product={product} variant="showcase" />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
