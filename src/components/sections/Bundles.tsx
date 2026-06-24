"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { bundles } from "@/lib/products";
import BundleCard from "@/components/BundleCard";

export default function Bundles() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="bundles"
      ref={ref}
      className="section-py section-padding"
      style={{
        background:
          "linear-gradient(180deg, #faf7f4 0%, #f0ebe3 50%, #faf7f4 100%)",
      }}
    >
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
            Built for Every Chapter
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

        {/* Bundles grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {bundles.map((bundle, index) => (
            <BundleCard key={bundle.id} bundle={bundle} index={index} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}
