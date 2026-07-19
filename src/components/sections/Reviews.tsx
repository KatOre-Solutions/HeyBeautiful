"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

const reviews = [
  {
    id: 1,
    name: "Sophia Laurent",
    role: "Fitness Coach & Mom",
    avatar: "/images/inspo-1.jpeg",
    rating: 5,
    title: "Finally, something made for us.",
    body: "I've tried dozens of supplement brands and always felt like they were designed for men who wanted to bulk up. Hey Beautiful is the first brand that actually gets what I need — to feel strong, energised, and radiant. The Glow Collagen Blend has completely transformed my skin in 8 weeks.",
    product: "Glow Collagen Blend",
    verified: true,
  },
  {
    id: 2,
    name: "Amara Osei",
    role: "Creative Director",
    avatar: "/images/inspo-2.jpeg",
    rating: 5,
    title: "My morning ritual is sacred now.",
    body: "The Morning Glow Ritual is something I look forward to every single day. It's not just a supplement — it's a ritual that tells my brain we're doing something for ourselves today. My energy is consistent, my focus is sharp, and people keep asking what I've changed.",
    product: "Morning Glow Ritual",
    verified: true,
  },
  {
    id: 3,
    name: "Isabella Torres",
    role: "Entrepreneur & Wellness Advocate",
    avatar: "/images/inspo-3.jpeg",
    rating: 5,
    title: "Worth every penny — and then some.",
    body: "I was skeptical about the price point but after one month I understood completely. The Plant Protein Luxe doesn't bloat me, it doesn't taste like chalk, and I actually look forward to my post-workout shake. I've also seen incredible improvements in my recovery times.",
    product: "Plant Protein Luxe",
    verified: true,
  },
  {
    id: 4,
    name: "Nadia Johansson",
    role: "Pilates Instructor",
    avatar: "/images/inspo-4.jpeg",
    rating: 5,
    title: "The Recovery Bundle is magic.",
    body: "Teaching 10 classes a week is demanding on the body. The Recovery Bundle has been transformative — I sleep deeper, wake up restored, and my clients have noticed a difference in my energy and presence. This brand truly understands the feminine body.",
    product: "Recovery Bundle",
    verified: true,
  },
  {
    id: 5,
    name: "Maya Chen",
    role: "Attorney & Marathon Runner",
    avatar: "/images/inspo-5.jpeg",
    rating: 5,
    title: "Performance without compromise.",
    body: "Training for marathons while managing a demanding career felt impossible. The Strength Bundle gave me the edge I needed without making me feel like I was sacrificing anything that makes me feel like myself. Strong and glowing — that's the Hey Beautiful promise kept.",
    product: "Strength Bundle",
    verified: true,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={12}
          className={cn(
            i < rating ? "fill-[#c9977a] text-[#c9977a]" : "text-[#c9977a]/25"
          )}
        />
      ))}
    </div>
  );
}

export default function Reviews() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const prev = () => {
    setDirection(-1);
    setActiveIndex((i) => (i - 1 + reviews.length) % reviews.length);
  };

  const next = () => {
    setDirection(1);
    setActiveIndex((i) => (i + 1) % reviews.length);
  };

  const active = reviews[activeIndex];

  return (
    <section
      ref={ref}
      className="section-py section-padding overflow-hidden"
      style={{ background: "#faf7f4" }}
    >
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
            <span className="label-caps text-[#c9977a]">Real Stories</span>
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
            She Said It Best.
          </motion.h2>
        </motion.div>

        {/* Featured review — large editorial */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="grid lg:grid-cols-2 gap-8 mb-12"
        >
          {/* Left — large quote */}
          <div className="relative">
            <div
              className="relative rounded-3xl p-8 md:p-10 h-full flex flex-col justify-between"
              style={{
                background: "rgba(255,255,255,0.65)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.5)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.06)",
              }}
            >
              {/* Quote icon */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-6 flex-shrink-0"
                style={{ background: "rgba(201,151,122,0.12)" }}
              >
                <Quote size={16} style={{ color: "#c9977a" }} />
              </div>

              {/* Animated review body */}
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={active.id}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="flex-1"
                >
                  <h3
                    className="heading-serif text-2xl md:text-3xl text-[#1e1814] mb-4 leading-tight"
                    style={{ fontFamily: "var(--font-cormorant)" }}
                  >
                    "{active.title}"
                  </h3>
                  <p
                    className="text-[#1e1814]/65 leading-relaxed mb-8"
                    style={{ fontSize: "0.9375rem", fontWeight: 300, lineHeight: 1.8 }}
                  >
                    {active.body}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Reviewer info */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`info-${active.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-4"
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#c9977a]/30">
                    {/* w-12 h-12 = 48px */}
                    <Image
                      src={active.avatar}
                      alt={active.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1e1814] text-sm">{active.name}</p>
                    <p className="text-[#1e1814]/50 text-xs">{active.role}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={active.rating} />
                      {active.verified && (
                        <span className="label-caps text-[#4361ee] text-[8px]">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <span
                      className="px-3 py-1 rounded-full text-[8px] tracking-wide uppercase font-medium"
                      style={{
                        background: "rgba(201,151,122,0.12)",
                        color: "#c9977a",
                        border: "1px solid rgba(201,151,122,0.25)",
                      }}
                    >
                      {active.product}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right — review stack */}
          <div className="flex flex-col gap-3">
            {reviews.map((review, i) => (
              <motion.button
                key={review.id}
                onClick={() => {
                  setDirection(i > activeIndex ? 1 : -1);
                  setActiveIndex(i);
                }}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "text-left rounded-2xl p-5 transition-all duration-400 border",
                  i === activeIndex
                    ? "shadow-soft"
                    : "border-transparent hover:border-[#c9977a]/20"
                )}
                style={{
                  background:
                    i === activeIndex
                      ? "rgba(255,255,255,0.85)"
                      : "rgba(255,255,255,0.4)",
                  backdropFilter: "blur(8px)",
                  border:
                    i === activeIndex
                      ? "1px solid rgba(201,151,122,0.3)"
                      : "1px solid rgba(255,255,255,0.5)",
                  boxShadow:
                    i === activeIndex ? "0 4px 24px rgba(0,0,0,0.07)" : "none",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-[#c9977a]/20">
                    <Image src={review.avatar} alt={review.name} fill className="object-cover" sizes="36px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-semibold text-[#1e1814] text-xs">{review.name}</p>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-[#1e1814]/55 text-xs truncate">{review.title}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-[#c9977a]/30 hover:bg-[#c9977a] hover:border-[#c9977a] hover:text-white text-[#c9977a] transition-all duration-300"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex gap-2">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > activeIndex ? 1 : -1);
                  setActiveIndex(i);
                }}
                className="transition-all duration-400 rounded-full"
                style={{
                  width: i === activeIndex ? "24px" : "6px",
                  height: "6px",
                  background: i === activeIndex ? "#c9977a" : "rgba(201,151,122,0.3)",
                }}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-[#c9977a]/30 hover:bg-[#c9977a] hover:border-[#c9977a] hover:text-white text-[#c9977a] transition-all duration-300"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Aggregate score banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-16 rounded-2xl p-8 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(201,151,122,0.1) 0%, rgba(168,132,93,0.06) 100%)",
            border: "1px solid rgba(201,151,122,0.2)",
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={18} className="fill-[#c9977a] text-[#c9977a]" />
            ))}
          </div>
          <div
            className="heading-display text-[#1e1814]"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "3.5rem",
              fontWeight: 300,
            }}
          >
            4.9 / 5
          </div>
          <p className="label-caps text-[#1e1814]/50 mt-1">
            Based on 907 verified reviews
          </p>
        </motion.div>
      </div>
    </section>
  );
}
