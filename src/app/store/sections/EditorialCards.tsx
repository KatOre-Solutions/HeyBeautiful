"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeUp, staggerContainerSlow, ease } from "@/lib/motion";

/**
 * Editorial break between the collection and the bundles — content, not another
 * product grid. Copy stays on the brand's existing ground (routine, ritual,
 * strength) and makes no health or medical claims.
 */
const cards = [
  {
    label: "Getting started",
    title: "Build your wellness routine",
    copy: "Where to begin, what to pair, and how to stack a morning and evening ritual that you'll actually keep.",
    cta: "Start here",
    href: "/#benefits",
    image: "/images/inspo-1.jpeg",
  },
  {
    label: "The edit",
    title: "Find your everyday essentials",
    copy: "The three products most routines are built around — and how to tell which of them yours is missing.",
    cta: "See the edit",
    href: "/#bundles",
    image: "/images/inspo-5.jpeg",
  },
  {
    label: "Why it matters",
    title: "Consistency over intensity",
    copy: "Why the routine you repeat quietly beats the one you start over. A short read on staying with it.",
    cta: "Read more",
    href: "/#story",
    image: "/images/inspo-6.jpeg",
  },
];

export default function EditorialCards() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="section-padding section-py"
      style={{ background: "linear-gradient(180deg, #faf7f4 0%, #f0ebe3 50%, #faf7f4 100%)" }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="flex items-center gap-3 mb-10"
        >
          <div className="h-px w-10 bg-[#c9977a]" />
          <span className="label-caps text-[#c9977a]">Explore more</span>
        </motion.div>

        <motion.div
          variants={staggerContainerSlow}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-3 gap-5 md:gap-6"
        >
          {cards.map((card) => (
            <motion.article key={card.title} variants={fadeUp}>
              <Link
                href={card.href}
                className="group block h-full rounded-2xl overflow-hidden bg-white shadow-soft hover:shadow-luxury transition-shadow duration-700"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  {/*   <768   1 col, px-6 (2*24)               -> 100vw - 48
                        <1024  3 cols, gap-6 (48), px-12 (96)   -> (100vw - 96 - 48)/3
                        <1280  3 cols, gap-6 (48), px-20 (160)  -> (100vw - 160 - 48)/3
                        >=1504 caps at max-w-7xl (1280)         -> (1280 - 48)/3 = 411 */}
                  <Image
                    src={card.image}
                    alt=""
                    aria-hidden
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1023px) calc(33.33vw - 48px), (max-width: 1279px) calc(33.33vw - 69px), (max-width: 1503px) calc(33.33vw - 91px), 411px"
                  />
                </div>

                <div className="p-6 md:p-7">
                  <p className="label-caps text-[#c9977a]/80 mb-2.5">{card.label}</p>
                  <h3
                    className="heading-serif text-ink text-xl md:text-2xl leading-tight mb-3"
                    style={{ fontFamily: "var(--font-cormorant)" }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="text-ink/60 leading-relaxed"
                    style={{ fontSize: "0.875rem", fontWeight: 300, lineHeight: 1.75 }}
                  >
                    {card.copy}
                  </p>

                  <motion.span
                    className="inline-flex items-center gap-2 mt-5 label-caps text-[10px] text-[#c9977a]"
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.4, ease: ease.luxury }}
                  >
                    {card.cta}
                    <ArrowRight size={13} />
                  </motion.span>
                </div>
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
