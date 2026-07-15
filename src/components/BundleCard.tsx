"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { Bundle } from "@/lib/products";

export default function BundleCard({
  bundle,
  index,
  isInView,
}: {
  bundle: Bundle;
  index: number;
  isInView: boolean;
}) {
  const { addItem } = useCart();

  const handleAddBundle = () => {
    addItem({
      id: `bundle:${bundle.id}`,
      name: bundle.name,
      category: "Bundle",
      price: bundle.price,
      image: bundle.products[0],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        delay: index * 0.12,
        duration: 0.9,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -6 }}
      className="relative overflow-hidden rounded-3xl cursor-pointer group"
      style={{ background: bundle.bg, boxShadow: "0 4px 40px rgba(0,0,0,0.07)" }}
    >
      <div className="flex flex-col sm:flex-row h-full min-h-[260px]">
        {/* Left — content */}
        <div className="flex-1 p-8 flex flex-col justify-between">
          {/* Top */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={12} style={{ color: bundle.accentColor }} />
              <span
                className="label-caps text-[9px]"
                style={{ color: bundle.accentColor, letterSpacing: "0.18em" }}
              >
                {bundle.tagline}
              </span>
            </div>

            <h3
              className="heading-display text-[#1e1814] mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              }}
            >
              {bundle.name}
            </h3>

            <p
              className="text-[#1e1814]/60 leading-relaxed"
              style={{ fontSize: "0.875rem", fontWeight: 300 }}
            >
              {bundle.description}
            </p>
          </div>

          {/* Bottom */}
          <div className="mt-6">
            {/* Savings badge */}
            <div className="inline-flex items-center gap-2 mb-4">
              <span
                className="px-2.5 py-1 rounded-full text-white text-[9px] font-semibold tracking-wide uppercase"
                style={{ background: bundle.accentColor }}
              >
                Save {bundle.savings}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span
                  className="heading-serif text-2xl text-[#1e1814]"
                  style={{ fontFamily: "var(--font-cormorant)" }}
                >
                  ${bundle.price}
                </span>
                <span className="text-[#1e1814]/35 text-sm line-through">
                  ${bundle.originalPrice}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAddBundle}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-[10px] font-semibold tracking-wide uppercase transition-all"
                style={{
                  background: bundle.accentColor,
                  boxShadow: `0 4px 20px ${bundle.accentColor}45`,
                }}
              >
                Shop Bundle
                <ArrowRight size={12} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Right — image + stacked products */}
        <div className="relative w-full sm:w-48 lg:w-56 flex-shrink-0">
          {/* Background editorial image */}
          <div className="absolute inset-0">
            <Image
              src={bundle.image}
              alt={bundle.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 224px"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(250,247,244,0.6) 0%, transparent 50%)",
              }}
            />
          </div>

          {/* Stacked product mini previews */}
          <div className="relative z-10 flex flex-row sm:flex-col justify-end sm:justify-start gap-3 p-4 h-full items-end sm:items-end pt-6">
            {bundle.products.map((img, i) => (
              <div
                key={i}
                className="relative w-14 aspect-[4/5] rounded-xl overflow-hidden border-2 border-white/70 shadow-soft flex-shrink-0"
                style={{
                  transform: `rotate(${i % 2 === 0 ? "-3deg" : "3deg"})`,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                }}
              >
                <Image src={img} alt="" fill className="object-cover" sizes="56px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
