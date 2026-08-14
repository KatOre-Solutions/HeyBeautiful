"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, Heart, Flower2, Lock } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";

/**
 * Opening band for /store: headline, CTA and the four reassurances on the left,
 * product still-life bleeding off the right edge.
 *
 * Kept deliberately SHORT. An earlier version ran a tall `aspect-[4/5]` image
 * plus an offset second image and `section-py`-scale padding, which pushed the
 * products below the fold — the opposite of what a storefront hero is for.
 *
 * From `lg` the image is absolutely positioned and full-bleed rather than a
 * contained card, so its own background continues into the section instead of
 * stopping at a rounded edge. Two things hide the seam: the section gradient
 * resolves to the image's cream (sampled from the file — its top and left edges
 * sit around #f4e2d4–#fceee5, near the brand's blush-100), and the image's left
 * edge is masked to a fade. The mask earns its place because the crop is only
 * cream at the top and left; its bottom carries the stone plinth (#77604d) and a
 * leaf (#b0b58c), so a hard left edge would show against the gradient.
 *
 * Below `lg` the same element returns to normal flow as a rounded card between
 * the copy and the trust row — text over a busy still-life doesn't stay readable
 * at that width, and the mask is dropped there since there's nothing to blend
 * into. The section is a flex column purely to get that copy → image → trust
 * order without duplicating the markup.
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
      className="relative overflow-hidden flex flex-col lg:block lg:min-h-[620px]"
      style={{
        background:
          "linear-gradient(100deg, #faf7f4 0%, #fbf3ec 45%, #f8ece1 72%, #f4e2d4 100%)",
      }}
    >
      {/* 1 — Copy. Capped short of the image so long headlines can't run under
             the products once the image takes the right 52%. */}
      <div className="order-1 relative section-padding pt-28 md:pt-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="lg:max-w-[46%]"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
              <div className="h-px w-10 bg-rose-gold" />
              <span className="label-caps text-rose-gold">The Collection</span>
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
        </div>
      </div>

      {/* 2 — Still-life. Rounded card in flow below lg; full-bleed and absolute
             from lg, where the left-edge mask blends it into the gradient. */}
      <div
        className="
          order-2 relative mt-10 mx-6 md:mx-12 aspect-[11/10] overflow-hidden rounded-2xl
          lg:absolute lg:inset-y-0 lg:right-0 lg:z-0 lg:m-0
          lg:w-auto lg:aspect-[916/840] lg:rounded-none lg:pointer-events-none
          lg:[mask-image:linear-gradient(to_right,transparent_0%,black_22%)]
          lg:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_22%)]
        "
      >
        <Image
          src="/images/hero-store.jpeg"
          alt="Hey Beautiful plant protein, collagen blend and radiance serum on a stone plinth"
          fill
          priority
          className="object-cover object-center"
          /* From lg the box is height-driven: inset-y-0 fixes the height to the
             section and aspect-[916/840] derives the width, so it lands near
             700px at the 620px min-height. */
          sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1023px) calc(100vw - 96px), 700px"
        />
      </div>

      {/* 3 — Trust row, under the copy and clear of the products. */}
      <div className="order-3 relative section-padding pt-10 lg:pt-12 pb-10 md:pb-14">
        <div className="max-w-7xl mx-auto">
          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="lg:max-w-[46%] pt-8 border-t border-[#e8dcd0]/80 grid grid-cols-2 sm:grid-cols-4 gap-y-7 gap-x-4"
          >
            {trust.map(({ icon: Icon, label }) => (
              <motion.li
                key={label}
                variants={fadeUp}
                className="flex flex-col items-center text-center gap-2.5"
              >
                <Icon size={22} strokeWidth={1.25} className="text-rose-gold" />
                <span className="label-caps text-ink/55 text-[9px] leading-[1.5] whitespace-pre-line">
                  {label}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
