"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";

const editorialMoments = [
  {
    image: "/images/inspo-5.jpeg",
    caption: "Morning Ritual",
    description: "Begin each day with intention.",
    aspect: "aspect-[3/4]",
    offset: "mt-0",
  },
  {
    image: "/images/inspo-6.jpeg",
    caption: "In Motion",
    description: "Strength that shows.",
    aspect: "aspect-square",
    offset: "mt-12",
  },
  {
    image: "/images/model-2.jpeg",
    caption: "Pure Confidence",
    description: "She glows from the inside.",
    aspect: "aspect-[3/4]",
    offset: "mt-0",
  },
];

export default function Lifestyle() {
  const ref = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const { scrollYProgress } = useScroll({
    target: bannerRef,
    offset: ["start end", "end start"],
  });
  const bannerY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <>
      {/* Lifestyle editorial grid */}
      <section
        id="lifestyle"
        ref={ref}
        className="section-py section-padding overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #faf7f4 0%, #f0ebe3 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16"
          >
            <div>
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
                <div className="h-px w-10 bg-[#c9977a]" />
                <span className="label-caps text-[#c9977a]">The Lifestyle</span>
              </motion.div>

              <motion.h2
                variants={fadeUp}
                className="heading-display text-[#1e1814]"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
                }}
              >
                Live in Full
                <br />
                <em style={{ fontStyle: "italic", color: "#c9977a" }}>
                  Bloom.
                </em>
              </motion.h2>
            </div>

            <motion.p
              variants={fadeUp}
              className="text-[#1e1814]/55 max-w-sm leading-relaxed md:text-right"
              style={{ fontSize: "0.95rem", fontWeight: 300 }}
            >
              Wellness is not a destination. It is a daily choice to show up
              for yourself — fully, beautifully, unapologetically.
            </motion.p>
          </motion.div>

          {/* Editorial image grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 items-start">
            {editorialMoments.map((moment, index) => (
              <motion.div
                key={moment.caption}
                initial={{ opacity: 0, y: 40 + index * 12 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: 0.1 + index * 0.15,
                  duration: 1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`relative ${moment.aspect} ${moment.offset} rounded-2xl overflow-hidden group cursor-pointer`}
              >
                <Image
                  src={moment.image}
                  alt={moment.caption}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-[1.07]"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />

                {/* Overlay */}
                <div
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(30,24,20,0.6) 0%, transparent 60%)",
                  }}
                />

                {/* Caption */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="label-caps text-[#c9977a] text-[9px] mb-1">
                    {moment.caption}
                  </p>
                  <p className="text-white/90 text-sm font-light">
                    {moment.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Full-bleed cinematic banner */}
      <section
        ref={bannerRef}
        className="relative h-[60vh] md:h-[70vh] overflow-hidden"
      >
        <motion.div className="absolute inset-0" style={{ y: bannerY }}>
          <Image
            src="/images/product-model.jpeg"
            alt="Hey Beautiful lifestyle"
            fill
            className="object-cover scale-110"
            sizes="100vw"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(30,24,20,0.6) 0%, rgba(30,24,20,0.3) 50%, rgba(201,151,122,0.2) 100%)",
            }}
          />
        </motion.div>

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center h-full section-padding text-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-10 bg-[#c9977a]/70" />
              <span className="label-caps text-[#c9977a]/90">The Promise</span>
              <div className="h-px w-10 bg-[#c9977a]/70" />
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="heading-display text-white mb-6"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(2.5rem, 6vw, 5rem)",
              }}
            >
              You Are the
              <br />
              <em style={{ fontStyle: "italic", color: "#e8c4ad" }}>
                Wellness Journey.
              </em>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="text-white/70 mb-10 leading-relaxed max-w-md mx-auto"
              style={{ fontSize: "0.95rem", fontWeight: 300 }}
            >
              Every supplement we create is a love letter to the woman who
              chooses herself every single day.
            </motion.p>

            <motion.div variants={fadeUp}>
              <a
                href="#community"
                className="btn-glass inline-flex items-center gap-2"
              >
                Join the Community
                <ArrowRight size={14} />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
