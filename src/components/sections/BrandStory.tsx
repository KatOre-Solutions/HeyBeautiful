"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { fadeUp, slideInLeft, slideInRight, staggerContainer, shimmerLine } from "@/lib/motion";

const pillars = [
  { label: "Performance", sub: "Engineered to perform" },
  { label: "Femininity", sub: "Crafted for her" },
  { label: "Wellness", sub: "Inside and out" },
  { label: "Confidence", sub: "Feel it every day" },
];

export default function BrandStory() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="story"
      ref={ref}
      className="relative overflow-hidden"
      style={{ background: "#faf7f4" }}
    >
      {/* Warm background shape */}
      <div
        className="absolute top-0 right-0 w-1/2 h-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top right, #f3d5cb 0%, transparent 65%)",
          opacity: 0.5,
        }}
      />

      <div className="relative section-padding section-py">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left — editorial imagery stack */}
          <motion.div
            variants={slideInLeft}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="relative"
          >
            {/* Main image */}
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5]">
              <Image
                src="/images/model.jpeg"
                alt="Hey Beautiful — strength meets glow"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Warm overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent 60%, rgba(30,24,20,0.3) 100%)",
                }}
              />
            </div>

            {/* Floating accent card */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -bottom-8 -right-6 md:-right-10 glass-card p-6 max-w-[220px]"
            >
              <div className="text-[#c9977a] mb-1">
                <span
                  className="heading-serif text-4xl"
                  style={{ fontFamily: "var(--font-cormorant)" }}
                >
                  5
                </span>
                <span className="text-sm ml-1 opacity-70">products</span>
              </div>
              <p className="text-[#1e1814]/70 text-sm leading-snug">
                Designed together to work as your complete wellness ritual.
              </p>
            </motion.div>

            {/* Product mockup floating */}
            <motion.div
              initial={{ opacity: 0, y: -24, scale: 0.92 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ delay: 0.7, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -top-6 -left-6 md:-left-10 w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden shadow-luxury border border-white/60"
            >
              <Image
                src="/images/product-mock-up.jpeg"
                alt="Product"
                fill
                className="object-cover"
              />
            </motion.div>
          </motion.div>

          {/* Right — copy */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="flex flex-col"
          >
            {/* Label */}
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
              <div className="deco-line" />
              <span className="label-caps text-[#c9977a]">Our Story</span>
            </motion.div>

            {/* Heading */}
            <motion.h2
              variants={fadeUp}
              className="heading-display text-[#1e1814] mb-6"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
              }}
            >
              Where Strength
              <br />
              <em style={{ fontStyle: "italic", color: "#c9977a" }}>
                Meets Glow.
              </em>
            </motion.h2>

            {/* Deco line */}
            <motion.div variants={shimmerLine} className="mb-8">
              <div className="deco-line" />
            </motion.div>

            {/* Body copy */}
            <motion.p
              variants={fadeUp}
              className="text-[#1e1814]/65 leading-relaxed mb-6"
              style={{ fontSize: "1rem", fontWeight: 300, lineHeight: 1.8 }}
            >
              Hey Beautiful was born from a simple truth: modern women should
              not have to choose between performing at their best and feeling
              their most radiant. We refused the outdated idea that supplements
              are a masculine category.
            </motion.p>

            <motion.p
              variants={fadeUp}
              className="text-[#1e1814]/65 leading-relaxed mb-12"
              style={{ fontSize: "1rem", fontWeight: 300, lineHeight: 1.8 }}
            >
              Every formula we create starts with one question: does this make
              her feel the way she deserves to feel? Strong. Glowing. Confident.
              Fully alive.
            </motion.p>

            {/* Pillars grid */}
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-2 gap-4 mb-12"
            >
              {pillars.map((p) => (
                <motion.div
                  key={p.label}
                  variants={fadeUp}
                  className="glass-card p-5"
                >
                  <p
                    className="heading-serif text-lg text-[#c9977a] mb-1"
                    style={{ fontFamily: "var(--font-cormorant)" }}
                  >
                    {p.label}
                  </p>
                  <p className="label-caps text-[#1e1814]/50 text-[9px]">
                    {p.sub}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp}>
              <a href="#products" className="btn-primary">
                Explore Products
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
