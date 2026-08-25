"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { bundles } from "@/lib/products";
import { getShowcaseProducts, type ShopifyProduct } from "@/lib/product";
import BundleCard from "@/components/BundleCard";
import BrandStory from "@/components/sections/BrandStory";
import { NAVBAR_ID } from "@/components/Navbar";
import StoreHero from "./sections/StoreHero";
import ShopByCategory, { ALL_CATEGORIES, buildCategoryTiles } from "./sections/ShopByCategory";
import FeaturedShowcase from "./sections/FeaturedShowcase";
import FullCollection, { COLLECTION_ID } from "./sections/FullCollection";
import EditorialCards from "./sections/EditorialCards";

/** Breathing room below the navbar's rendered bottom edge, on top of its measured height. */
const SCROLL_GAP = 16;

/**
 * Composition, plus the page's single piece of state. Every section is
 * presentational and reads products from props, so the store never knows or
 * cares whether the catalogue came from Shopify or the development source (#68).
 *
 * The category filter deliberately reaches only `FullCollection`.
 * `FeaturedShowcase` is a curated shelf and stays put — see the note in that file.
 */
export default function StoreContent({ products }: { products: ShopifyProduct[] }) {
  const reducedMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const bundlesRef = useRef<HTMLDivElement>(null);
  const bundlesInView = useInView(bundlesRef, { once: true, margin: "-80px" });

  const tiles = useMemo(() => buildCategoryTiles(products), [products]);
  // Three, to fill the showcase's 3-col grid exactly rather than orphaning one.
  const showcase = useMemo(() => getShowcaseProducts(products, 3), [products]);

  /**
   * Scrolls the collection under the fixed navbar.
   *
   * `scrollTo` with an explicit offset rather than `scrollIntoView` +
   * `scroll-margin-top`: it passes an explicit behaviour instead of inheriting
   * the `html { scroll-behavior: smooth }` in globals.css. The offset is the
   * navbar's own measured height rather than a hardcoded constant, so it can't
   * drift out of sync with Navbar's padding/logo size.
   */
  const scrollToCollection = useCallback(() => {
    const el = document.getElementById(COLLECTION_ID);
    if (!el) return;
    const navbar = document.getElementById(NAVBAR_ID);
    const navbarOffset = navbar ? navbar.getBoundingClientRect().bottom : 0;
    const top = el.getBoundingClientRect().top + window.scrollY - navbarOffset - SCROLL_GAP;
    window.scrollTo({ top, behavior: reducedMotion ? "instant" : "smooth" });
  }, [reducedMotion]);

  const handleSelectCategory = useCallback(
    (value: string) => {
      setActiveCategory(value);
      scrollToCollection();
    },
    [scrollToCollection]
  );

  const clearCategory = useCallback(() => setActiveCategory(ALL_CATEGORIES), []);

  /**
   * On this page "Shop Bundle" would otherwise link to `/store` — the page the
   * shopper is already on. Send them to the collection instead, reusing the same
   * measured scroll `StoreHero` uses. The card keeps `#collection` as its href so
   * the control still works without JS.
   */
  const handleBundleShop = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      scrollToCollection();
    },
    [scrollToCollection]
  );

  return (
    <>
      <StoreHero onShopClick={scrollToCollection} />
      <ShopByCategory tiles={tiles} active={activeCategory} onSelect={handleSelectCategory} />
      <FeaturedShowcase products={showcase} />
      <FullCollection
        products={products}
        activeCategory={activeCategory}
        onClear={clearCategory}
      />
      <EditorialCards />
      <BrandStory />

      {/* Bundles — unchanged merchandising, still hardcoded (see #65). */}
      <section
        ref={bundlesRef}
        className="section-py section-padding bg-gradient-to-b from-cream via-parchment to-cream"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={bundlesInView ? "visible" : "hidden"}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-10 bg-rose-gold" />
              <span className="label-caps text-rose-gold">Curated Bundles</span>
              <div className="h-px w-10 bg-rose-gold" />
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="heading-display text-ink"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
              }}
            >
              Save More, Glow More
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="mt-4 text-ink/55 max-w-md mx-auto leading-relaxed"
              style={{ fontSize: "0.95rem", fontWeight: 300 }}
            >
              Thoughtfully paired formulas that work synergistically, so you get
              more from every ritual.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {bundles.map((bundle, index) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                index={index}
                isInView={bundlesInView}
                href={`#${COLLECTION_ID}`}
                onShopClick={handleBundleShop}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
