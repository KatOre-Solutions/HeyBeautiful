"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { fadeUp, staggerContainer, staggerContainerSlow } from "@/lib/motion";
import { products, bundles } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import BundleCard from "@/components/BundleCard";

export default function StoreContent() {
  const bundlesRef = useRef<HTMLDivElement>(null);
  const bundlesInView = useInView(bundlesRef, { once: true, margin: "-80px" });

  return (
    <>
      {/* Page header — extra top padding clears the fixed navbar (no hero here) */}
      <section
        className="section-padding pt-32 pb-12 md:pt-40 md:pb-16"
        style={{ background: "#faf7f4" }}
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto text-center"
        >
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-10 bg-[#c9977a]" />
            <span className="label-caps text-[#c9977a]">The Store</span>
            <div className="h-px w-10 bg-[#c9977a]" />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="heading-display text-[#1e1814]"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
            }}
          >
            Shop the Full Collection
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-4 text-[#1e1814]/55 max-w-md mx-auto leading-relaxed"
            style={{ fontSize: "0.95rem", fontWeight: 300 }}
          >
            Every formula, every ritual — crafted to fuel your strength and keep your glow.
          </motion.p>
        </motion.div>
      </section>

      {/* All products */}
      <section className="section-padding pb-20 md:pb-28" style={{ background: "#faf7f4" }}>
        <motion.div
          variants={staggerContainerSlow}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>
      </section>

      {/* Bundles */}
      <section
        ref={bundlesRef}
        className="section-py section-padding"
        style={{
          background:
            "linear-gradient(180deg, #faf7f4 0%, #f0ebe3 50%, #faf7f4 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={bundlesInView ? "visible" : "hidden"}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-10 bg-[#c9977a]" />
              <span className="label-caps text-[#c9977a]">Curated Bundles</span>
              <div className="h-px w-10 bg-[#c9977a]" />
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="heading-display text-[#1e1814]"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
              }}
            >
              Save More, Glow More
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="mt-4 text-[#1e1814]/55 max-w-md mx-auto leading-relaxed"
              style={{ fontSize: "0.95rem", fontWeight: 300 }}
            >
              Thoughtfully paired formulas that work synergistically, so you get
              more from every ritual.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {bundles.map((bundle, index) => (
              <BundleCard key={bundle.id} bundle={bundle} index={index} isInView={bundlesInView} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
