"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { fadeUp, staggerContainer, scaleIn } from "@/lib/motion";
import { useCart } from "@/context/CartContext";

const bundles = [
  {
    id: "glow",
    name: "Glow Bundle",
    tagline: "Radiance from within",
    description:
      "Collagen blend + beauty vitamins + hydration booster for skin that truly glows.",
    price: 128,
    originalPrice: 162,
    savings: "21% off",
    products: ["/images/item-1.jpeg", "/images/item-3.jpeg"],
    bg: "linear-gradient(135deg, #f9ede8 0%, #f3d5cb 100%)",
    accentColor: "#c9977a",
    image: "/images/inspo-1.jpeg",
  },
  {
    id: "recovery",
    name: "Recovery Bundle",
    tagline: "Rest. Repair. Rise.",
    description:
      "Sleep support + muscle repair blend + magnesium complex for deep recovery.",
    price: 106,
    originalPrice: 134,
    savings: "21% off",
    products: ["/images/item-4.jpeg", "/images/item-2.jpeg"],
    bg: "linear-gradient(135deg, #eff3ff 0%, #dce6fd 100%)",
    accentColor: "#4361ee",
    image: "/images/inspo-2.jpeg",
  },
  {
    id: "morning",
    name: "Morning Ritual Bundle",
    tagline: "Start with intention",
    description:
      "Energy blend + focus formula + morning greens for a luminous, powered start.",
    price: 118,
    originalPrice: 150,
    savings: "21% off",
    products: ["/images/item-3.jpeg", "/images/item-1.jpeg"],
    bg: "linear-gradient(135deg, #faf8f5 0%, #f3ede4 100%)",
    accentColor: "#a8845d",
    image: "/images/inspo-3.jpeg",
  },
  {
    id: "strength",
    name: "Strength Bundle",
    tagline: "Power. Performance. Pride.",
    description:
      "Plant protein + pre-workout blend + electrolytes for peak feminine strength.",
    price: 134,
    originalPrice: 172,
    savings: "22% off",
    products: ["/images/item-2.jpeg", "/images/item-5.jpeg"],
    bg: "linear-gradient(135deg, #f3ede4 0%, #e5d8c6 100%)",
    accentColor: "#8b5e52",
    image: "/images/inspo-4.jpeg",
  },
];

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

function BundleCard({
  bundle,
  index,
  isInView,
}: {
  bundle: (typeof bundles)[0];
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
                className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/70 shadow-soft flex-shrink-0"
                style={{
                  transform: `rotate(${i % 2 === 0 ? "-3deg" : "3deg"})`,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                }}
              >
                <Image src={img} alt="" fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
