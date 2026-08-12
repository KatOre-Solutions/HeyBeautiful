"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, Heart, Flower2, Lock } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";

/**
 * Opening band for /store: headline and CTA left, product still-life right, with
 * the four reassurances along the bottom.
 *
 * Kept deliberately SHORT. An earlier version ran a tall `aspect-[4/5]` image
 * plus an offset second image and `section-py`-scale padding, which pushed the
 * products themselves below the fold — the opposite of what a storefront hero is
 * for. The reference storefronts fit hero, trust row and the top of the next
 * section within roughly one screen, so the image is close to square and the
 * vertical padding is a fraction of a normal section's.
 *
 * The trust row lives here rather than in its own section for the same reason:
 * as a separate band it added a full section's padding to say four short things.
 */
const trust = [
  { icon: Leaf, label: "Quality\ningredients" },
  { icon: Heart, label: "Wellness\nfocused" },
  { icon: Flower2, label: "Made for\nyour routine" },
  { icon: Lock, label: "Secure\ncheckout" },
];

export default function StoreHero({ onShopClick }: { onShopClick: () => void }) {
  return (
    <section
      className="relative overflow-hidden section-padding pt-28 md:pt-32 pb-10 md:pb-12"
      style={{ background: "linear-gradient(150deg, #faf7f4 0%, #f7f0ea 60%, #f3ebe3 100%)" }}
    >
      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
              <div className="h-px w-10 bg-[#c9977a]" />
              <span className="label-caps text-[#c9977a]">The Collection</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="heading-display text-ink text-balance"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(2.25rem, 4.2vw, 3.5rem)",
              }}
            >
              Everything you need to feel{" "}
              <span className="text-blush-600">beautifully</span> you.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-5 text-ink/60 max-w-sm leading-relaxed"
              style={{ fontSize: "0.9375rem", fontWeight: 300, lineHeight: 1.8 }}
            >
              Premium wellness essentials, designed for your everyday.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center gap-4">
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

          {/* Product still-life. Close to square so it sits beside the copy
              without dictating the section's height. */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="relative w-full max-w-[560px] lg:max-w-none mx-auto"
          >
            <div className="relative aspect-[11/10] rounded-2xl overflow-hidden">
              {/*   <768   1 col, section-padding px-6  (2*24)          -> 100vw - 48
                    <1024  1 col, px-12 (2*48)                          -> 100vw - 96
                    <1280  2 cols, gap-16 (64), px-20 (2*80)            -> (100vw - 160 - 64)/2
                    <1504  2 cols, gap-16 (64), px-28 (2*112)           -> (100vw - 224 - 64)/2
                    >=1504 grid caps at max-w-7xl (1280)                -> (1280 - 64)/2 = 608 */}
              <Image
                src="/images/hero-store.jpeg"
                alt="Hey Beautiful plant protein, collagen blend and radiance serum on a stone plinth"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1023px) calc(100vw - 96px), (max-width: 1279px) calc(50vw - 112px), (max-width: 1503px) calc(50vw - 144px), 608px"
              />
            </div>
          </motion.div>
        </div>

        {/* Trust row */}
        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-10 md:mt-12 pt-8 border-t border-[#e8dcd0] grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4"
        >
          {trust.map(({ icon: Icon, label }) => (
            <motion.li
              key={label}
              variants={fadeUp}
              className="flex flex-col items-center text-center gap-2.5"
            >
              <Icon size={22} strokeWidth={1.25} className="text-[#c9977a]" />
              <span className="label-caps text-ink/55 text-[9px] leading-[1.5] whitespace-pre-line">
                {label}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
