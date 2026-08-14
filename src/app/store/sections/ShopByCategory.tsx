"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeUp, staggerContainer, ease } from "@/lib/motion";
import type { ShopifyProduct } from "@/lib/product";

/** Sentinel for "no filter". Not a real category, so it can't collide with one. */
export const ALL_CATEGORIES = "__all__";

export interface CategoryTile {
  /** The `category` value to filter on, or ALL_CATEGORIES. */
  value: string;
  label: string;
  image: string;
  count: number;
}

/**
 * Categories are derived from the catalogue rather than hardcoded, so this works
 * unchanged when Shopify's `productType` values replace the development ones —
 * no list to keep in sync, and no category that renders empty.
 *
 * Each tile borrows the first image from its own category, which keeps the row
 * looking like the products behind it.
 */
export function buildCategoryTiles(products: ShopifyProduct[]): CategoryTile[] {
  const byCategory = new Map<string, ShopifyProduct[]>();
  for (const p of products) {
    const list = byCategory.get(p.category);
    if (list) list.push(p);
    else byCategory.set(p.category, [p]);
  }

  const tiles: CategoryTile[] = [...byCategory.entries()].map(([label, items]) => ({
    value: label,
    label,
    image: items[0]?.image ?? "/images/item-1.jpeg",
    count: items.length,
  }));

  return [
    {
      value: ALL_CATEGORIES,
      label: "All Products",
      image: products[0]?.image ?? "/images/item-1.jpeg",
      count: products.length,
    },
    ...tiles,
  ];
}

export default function ShopByCategory({
  tiles,
  active,
  onSelect,
}: {
  tiles: CategoryTile[];
  active: string;
  onSelect: (value: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  // Nothing to browse by when the catalogue is empty or single-category.
  if (tiles.length <= 2) return null;

  return (
    <section ref={ref} className="section-padding pt-16 md:pt-24 bg-cream">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-12"
        >
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-10 bg-rose-gold" />
            <span className="label-caps text-rose-gold">Browse</span>
            <div className="h-px w-10 bg-rose-gold" />
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="heading-display text-ink"
            style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
          >
            Shop by category
          </motion.h2>
        </motion.div>

        {/* Scrolls horizontally on small screens rather than wrapping into a
            ragged grid — the row reads as one gesture. */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="flex gap-5 sm:gap-8 overflow-x-auto sm:flex-wrap sm:justify-center pb-2 -mx-6 px-6 sm:mx-0 sm:px-0"
        >
          {tiles.map((tile) => {
            const selected = active === tile.value;
            return (
              <motion.button
                key={tile.value}
                variants={fadeUp}
                onClick={() => onSelect(tile.value)}
                aria-pressed={selected}
                className="group flex flex-col items-center gap-3 flex-shrink-0 w-[86px] sm:w-[104px]"
              >
                <motion.span
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.45, ease: ease.luxury }}
                  className={cn(
                    "relative block w-[76px] h-[76px] sm:w-[92px] sm:h-[92px] rounded-full overflow-hidden transition-shadow duration-500",
                    selected
                      ? "shadow-glow outline outline-2 outline-offset-[3px] outline-rose-gold"
                      : "shadow-soft outline outline-1 outline-offset-0 outline-[rgba(232,220,208,0.9)]"
                  )}
                >
                  <Image
                    src={tile.image}
                    alt=""
                    aria-hidden
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="92px"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 transition-opacity duration-500"
                    style={{
                      background: "linear-gradient(to top, rgba(30,24,20,0.28), transparent 60%)",
                      opacity: selected ? 0.25 : 1,
                    }}
                  />
                </motion.span>

                <span
                  className={cn(
                    "label-caps text-[9px] sm:text-[10px] text-center leading-tight transition-colors duration-300",
                    selected ? "text-rose-gold" : "text-ink/55 group-hover:text-ink"
                  )}
                >
                  {tile.label}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
