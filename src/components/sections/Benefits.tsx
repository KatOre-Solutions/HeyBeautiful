"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles, Leaf, Zap, Moon, Heart, Shield } from "lucide-react";
import { fadeUp, staggerContainer, staggerContainerSlow } from "@/lib/motion";

const benefits = [
  {
    icon: Sparkles,
    title: "Beauty Support",
    description:
      "Collagen peptides, biotin, and antioxidants that work from the inside out to give your skin, hair, and nails that natural luminosity.",
    color: "#c9977a",
    bg: "rgba(201,151,122,0.08)",
    border: "rgba(201,151,122,0.2)",
  },
  {
    icon: Leaf,
    title: "Plant Protein",
    description:
      "Clean, complete plant-based protein that fuels your workouts and supports lean muscle — without the heavy, bloated feeling.",
    color: "#a8845d",
    bg: "rgba(168,132,93,0.08)",
    border: "rgba(168,132,93,0.2)",
  },
  {
    icon: Heart,
    title: "Feminine Wellness",
    description:
      "Adaptogens and hormone-supportive botanicals selected specifically to support the female body through every phase of life.",
    color: "#8b5e52",
    bg: "rgba(139,94,82,0.08)",
    border: "rgba(139,94,82,0.2)",
  },
  {
    icon: Zap,
    title: "Clean Energy",
    description:
      "Natural energy that flows — no jitters, no crash. B-vitamins, matcha, and adaptogens that support sustained focus and vitality.",
    color: "#4361ee",
    bg: "rgba(67,97,238,0.07)",
    border: "rgba(67,97,238,0.18)",
  },
  {
    icon: Moon,
    title: "Recovery & Rest",
    description:
      "Magnesium, ashwagandha, and calming botanicals that ease your body into deep recovery so you wake up restored and radiant.",
    color: "#7775aa",
    bg: "rgba(119,117,170,0.08)",
    border: "rgba(119,117,170,0.2)",
  },
  {
    icon: Shield,
    title: "Confidence Formula",
    description:
      "The cumulative effect of everything working together — a body that feels strong, a mind that feels sharp, a woman who glows.",
    color: "#c9977a",
    bg: "rgba(201,151,122,0.08)",
    border: "rgba(201,151,122,0.2)",
  },
];

const stats = [
  { number: "50k+", label: "Women Served" },
  { number: "4.9", label: "Average Rating" },
  { number: "100%", label: "Plant Sourced" },
  { number: "0", label: "Artificial Fillers" },
];

export default function Benefits() {
  const ref = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const statsInView = useInView(statsRef, { once: true, margin: "-60px" });

  return (
    <section
      id="benefits"
      className="overflow-hidden"
      style={{ background: "#faf7f4" }}
    >
      {/* Stats strip */}
      <div
        ref={statsRef}
        className="border-y border-[#e8dcd0] py-10"
        style={{ background: "#f0ebe3" }}
      >
        <div className="section-padding max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={fadeUp}>
                <div
                  className="heading-display text-[#c9977a]"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
                    fontWeight: 300,
                  }}
                >
                  {stat.number}
                </div>
                <p className="label-caps text-[#1e1814]/50 mt-1 text-[9px]">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Benefits grid */}
      <div ref={ref} className="section-py section-padding">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-10 bg-[#c9977a]" />
              <span className="label-caps text-[#c9977a]">Why Hey Beautiful</span>
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
              Everything She Deserves
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="mt-4 text-[#1e1814]/55 max-w-md mx-auto leading-relaxed"
              style={{ fontSize: "0.95rem", fontWeight: 300 }}
            >
              Six dimensions of wellness, engineered with intention, designed
              for the modern woman.
            </motion.p>
          </motion.div>

          {/* Cards grid */}
          <motion.div
            variants={staggerContainerSlow}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {benefits.map((benefit) => (
              <BenefitCard key={benefit.title} benefit={benefit} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function BenefitCard({
  benefit,
}: {
  benefit: (typeof benefits)[0];
}) {
  const Icon = benefit.icon;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative rounded-2xl p-7 cursor-default overflow-hidden group"
      style={{
        background: benefit.bg,
        border: `1px solid ${benefit.border}`,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Subtle glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at top left, ${benefit.color}15 0%, transparent 60%)`,
        }}
      />

      {/* Icon */}
      <div
        className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-5 flex-shrink-0"
        style={{
          background: `${benefit.color}15`,
          border: `1px solid ${benefit.color}30`,
        }}
      >
        <Icon size={20} style={{ color: benefit.color }} />
      </div>

      {/* Content */}
      <h3
        className="heading-serif text-xl text-[#1e1814] mb-3"
        style={{ fontFamily: "var(--font-cormorant)" }}
      >
        {benefit.title}
      </h3>

      <p
        className="text-[#1e1814]/60 leading-relaxed"
        style={{ fontSize: "0.875rem", fontWeight: 300, lineHeight: 1.75 }}
      >
        {benefit.description}
      </p>

      {/* Bottom accent line */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full rounded-full transition-all duration-700"
        style={{ background: `linear-gradient(to right, ${benefit.color}, transparent)` }}
      />
    </motion.div>
  );
}
