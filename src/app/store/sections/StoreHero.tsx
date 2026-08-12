"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeUp, heroEntrance, staggerContainer } from "@/lib/motion";

/**
 * Opening composition for /store. Deliberately not a centred heading above a
 * grid: the page has to read as a storefront before it reads as a list.
 *
 * Extra top padding clears the fixed navbar — there's no full-bleed video here
 * to sit under it.
 */
export default function StoreHero({ onShopClick }: { onShopClick: () => void }) {
  const reducedMotion = useReducedMotion();

  return (
    <section
      className="relative overflow-hidden section-padding pt-32 pb-16 md:pt-40 md:pb-24"
      style={{ background: "linear-gradient(160deg, #faf7f4 0%, #f5eee7 55%, #f0ebe3 100%)" }}
    >
      {/* Warm wash behind the product imagery, mirroring the homepage hero. */}
      <div
        aria-hidden
        className="absolute top-0 right-0 w-2/3 h-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 70% 30%, #f3d5cb 0%, transparent 62%)",
          opacity: 0.55,
        }}
      />

      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
            <div className="h-px w-10 bg-[#c9977a]" />
            <span className="label-caps text-[#c9977a]">The Collection</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="heading-display text-ink text-balance"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2.75rem, 5.5vw, 4.75rem)",
            }}
          >
            Everything you need to feel beautifully you.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 text-ink/60 max-w-md leading-relaxed"
            style={{ fontSize: "1rem", fontWeight: 300, lineHeight: 1.8 }}
          >
            Formulas built around the way you actually live — the morning ritual,
            the training block, the long day, the night that restores you. Choose
            what your routine is missing.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-4">
            <button onClick={onShopClick} className="btn-luxury btn-primary group">
              Shop the collection
              <ArrowRight
                size={15}
                className="transition-transform duration-500 group-hover:translate-x-1"
              />
            </button>
            <span className="label-caps text-ink/40 text-[10px]">
              Free delivery over R 750
            </span>
          </motion.div>
        </motion.div>

        {/* Imagery — a stacked pair rather than one flat product shot. */}
        <motion.div
          variants={reducedMotion ? fadeUp : heroEntrance}
          initial="hidden"
          animate="visible"
          className="relative"
        >
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-luxury">
            {/*   <1024  1 col, section-padding px-6..px-12 -> ~100vw
                  <1280  2 cols, gap-20 (80), px-20 (160)   -> (100vw - 160 - 80)/2
                  >=1504 grid caps at max-w-7xl (1280)      -> (1280 - 80)/2 = 600 */}
            <Image
              src="/images/product-model.jpeg"
              alt="Hey Beautiful supplements styled on a warm surface"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1023px) 100vw, (max-width: 1503px) calc(50vw - 120px), 600px"
            />
          </div>

          {/* Offset second image, hidden on small screens where it would crowd. */}
          <div className="hidden md:block absolute -bottom-10 -left-10 w-40 lg:w-52 aspect-[4/5] rounded-2xl overflow-hidden shadow-luxury ring-8 ring-[#faf7f4]">
            <Image
              src="/images/item-3.jpeg"
              alt=""
              aria-hidden
              fill
              className="object-cover"
              sizes="(max-width: 1023px) 160px, 208px"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
