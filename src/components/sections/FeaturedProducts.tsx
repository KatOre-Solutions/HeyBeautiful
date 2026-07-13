"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { fadeUp, staggerContainer, staggerContainerSlow } from "@/lib/motion";
import ShopifyProductCard from "@/components/ShopifyProductCard";
import type { ShopifyProduct } from "@/lib/shopify";

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
            <ShopifyProductCard key={product.id} product={product} />
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
