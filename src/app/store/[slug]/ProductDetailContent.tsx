"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, ShoppingBag, Heart, Check } from "lucide-react";
import { fadeUp, staggerContainer, staggerContainerSlow } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/products";

function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            i < Math.round(rating)
              ? "fill-rose-gold text-rose-gold"
              : "text-rose-gold/30"
          )}
        />
      ))}
    </div>
  );
}

type ReviewFilter = number | "all";

export default function ProductDetailContent({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const [activeImage, setActiveImage] = useState(product.gallery[0] ?? product.image);
  const [variant, setVariant] = useState(product.variants[0]);
  const [added, setAdded] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");

  const reviewsRef = useRef<HTMLElement>(null);

  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const wished = isWishlisted(product.id);

  // Star ratings (5→1) that actually have reviews, with their counts.
  const ratingFilters = useMemo(
    () =>
      [5, 4, 3, 2, 1]
        .map((r) => ({ rating: r, count: product.reviewList.filter((x) => x.rating === r).length }))
        .filter((g) => g.count > 0),
    [product.reviewList]
  );

  const filteredReviews =
    reviewFilter === "all"
      ? product.reviewList
      : product.reviewList.filter((r) => r.rating === reviewFilter);

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAddToCart = () => {
    addItem({
      id: `${product.id}#${variant.id}`,
      name: `${product.name} — ${variant.label}`,
      category: product.category,
      price: variant.price,
      image: product.image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleWish = () => {
    toggleItem({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image,
    });
  };

  return (
    <>
      {/* Detail — gallery + info */}
      <section className="section-padding pt-32 pb-16 md:pt-40" style={{ background: "#faf7f4" }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4"
          >
            <motion.div
              variants={fadeUp}
              className="relative aspect-[4/5] rounded-3xl overflow-hidden"
              style={{ background: "#f0ebe3" }}
            >
              {/* Column width, derived from this page's grid. It's lg:grid-cols-2,
                  so it stays single-column below 1024 — and above 1504 the grid
                  caps at max-w-7xl, so the column stops at 608 rather than 50vw:
                    <768   1 col, section-padding px-6 (2*24)   -> 100vw - 48
                    <1024  1 col, px-12 (2*48)                  -> 100vw - 96
                    <1280  2 cols, lg:gap-16 (64), px-20 (2*80) -> (100vw - 160 - 64)/2
                    <1504  2 cols, gap 64, px-28 (2*112)        -> (100vw - 224 - 64)/2
                    >=1504 caps at 1280                         -> (1280 - 64)/2 = 608 */}
              <Image
                src={activeImage}
                alt={product.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1023px) calc(100vw - 96px), (max-width: 1279px) calc(50vw - 112px), (max-width: 1503px) calc(50vw - 144px), 608px"
              />
            </motion.div>

            {product.gallery.length > 1 && (
              <motion.div variants={fadeUp} className="flex gap-3">
                {product.gallery.map((img) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(img)}
                    className={cn(
                      "relative w-20 aspect-[4/5] rounded-xl overflow-hidden flex-shrink-0 transition-all",
                      activeImage === img
                        ? "ring-2 ring-rose-gold ring-offset-2 ring-offset-[#faf7f4]"
                        : "opacity-70 hover:opacity-100"
                    )}
                    style={{ background: "#f0ebe3" }}
                    aria-label="View image"
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col"
          >
            <motion.p variants={fadeUp} className="label-caps text-rose-gold mb-3">
              {product.category}
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="heading-display text-ink"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
              }}
            >
              {product.name}
            </motion.h1>

            {/* Rating — click to jump to reviews */}
            <motion.div variants={fadeUp} className="mt-3">
              <button
                type="button"
                onClick={scrollToReviews}
                className="group flex items-center gap-2 hover:opacity-70 transition-opacity"
                aria-label={`Read ${product.reviews} reviews`}
              >
                <Stars rating={product.rating} />
                <span className="text-ink/50 text-sm group-hover:underline">
                  {product.rating} · {product.reviews} reviews
                </span>
              </button>
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-baseline gap-3 mt-5">
              <span
                className="heading-serif text-ink"
                style={{ fontFamily: "var(--font-cormorant)", fontSize: "2rem" }}
              >
                ${variant.price}
              </span>
              {product.originalPrice && (
                <span className="text-ink/35 text-lg line-through">
                  ${product.originalPrice}
                </span>
              )}
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="text-ink/65 leading-relaxed mt-5"
              style={{ fontFamily: "var(--font-manrope)", fontSize: "0.95rem", fontWeight: 300 }}
            >
              {product.description}
            </motion.p>

            {/* Variants */}
            <motion.div variants={fadeUp} className="mt-7">
              <p className="label-caps text-ink/55 mb-3" style={{ fontSize: "10px" }}>
                Size
              </p>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariant(v)}
                    className={cn(
                      "px-4 py-2.5 rounded-full text-sm transition-all",
                      variant.id === v.id
                        ? "bg-rose-gold text-white"
                        : "text-ink/70 hover:text-ink"
                    )}
                    style={
                      variant.id === v.id
                        ? { fontFamily: "var(--font-manrope)" }
                        : {
                            fontFamily: "var(--font-manrope)",
                            background: "rgba(201,151,122,0.08)",
                            border: "1px solid rgba(201,151,122,0.25)",
                          }
                    }
                  >
                    {v.label} · ${v.price}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div variants={fadeUp} className="flex items-center gap-3 mt-8">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-4 rounded-full bg-rose-gold text-white font-semibold text-[11px] tracking-[0.13em] uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  fontFamily: "var(--font-manrope)",
                  boxShadow: "0 6px 24px rgba(201,151,122,0.38)",
                }}
              >
                {added ? (
                  <>
                    <Check size={15} /> Added to Bag
                  </>
                ) : (
                  <>
                    <ShoppingBag size={15} /> Add to Bag
                  </>
                )}
              </button>

              <button
                onClick={handleWish}
                className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-105"
                style={{
                  background: wished ? "rgba(239,68,68,0.1)" : "rgba(201,151,122,0.08)",
                  border: wished
                    ? "1px solid rgba(239,68,68,0.3)"
                    : "1px solid rgba(201,151,122,0.25)",
                }}
                aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  size={18}
                  className={cn(wished ? "fill-red-500 text-red-500" : "text-rose-gold")}
                />
              </button>
            </motion.div>

            {/* Tags */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mt-7">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-ink/60 text-[10px] tracking-[0.1em] uppercase"
                  style={{
                    background: "rgba(201,151,122,0.08)",
                    border: "1px solid rgba(201,151,122,0.18)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section
          className="section-py section-padding"
          style={{ background: "linear-gradient(180deg, #faf7f4 0%, #f0ebe3 50%, #faf7f4 100%)" }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="h-px w-10 bg-rose-gold" />
                <span className="label-caps text-rose-gold">You May Also Love</span>
                <div className="h-px w-10 bg-rose-gold" />
              </div>
              <h2
                className="heading-display text-ink"
                style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(2rem, 4vw, 3rem)" }}
              >
                Complete Your Ritual
              </h2>
            </div>

            <motion.div
              variants={staggerContainerSlow}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
            >
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Reviews */}
      <section
        ref={reviewsRef}
        id="reviews"
        className="section-padding py-20 scroll-mt-28"
        style={{ background: "#faf7f4" }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <h2
              className="heading-display text-ink"
              style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}
            >
              Customer Reviews
            </h2>
            <div className="flex items-center gap-2 ml-auto">
              <Stars rating={product.rating} size={15} />
              <span className="text-ink/55 text-sm">{product.rating} / 5</span>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <button
              type="button"
              onClick={() => setReviewFilter("all")}
              className={cn(
                "px-4 py-2 rounded-full text-xs transition-all",
                reviewFilter === "all" ? "bg-rose-gold text-white" : "text-ink/70 hover:text-ink"
              )}
              style={
                reviewFilter === "all"
                  ? { fontFamily: "var(--font-manrope)" }
                  : {
                      fontFamily: "var(--font-manrope)",
                      background: "rgba(201,151,122,0.08)",
                      border: "1px solid rgba(201,151,122,0.25)",
                    }
              }
            >
              All ({product.reviewList.length})
            </button>

            {ratingFilters.map(({ rating, count }) => (
              <button
                key={rating}
                type="button"
                onClick={() => setReviewFilter(rating)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs transition-all flex items-center gap-1",
                  reviewFilter === rating ? "bg-rose-gold text-white" : "text-ink/70 hover:text-ink"
                )}
                style={
                  reviewFilter === rating
                    ? { fontFamily: "var(--font-manrope)" }
                    : {
                        fontFamily: "var(--font-manrope)",
                        background: "rgba(201,151,122,0.08)",
                        border: "1px solid rgba(201,151,122,0.25)",
                      }
                }
              >
                {rating}
                <Star
                  size={11}
                  className={reviewFilter === rating ? "fill-white text-white" : "fill-rose-gold text-rose-gold"}
                />
                ({count})
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {filteredReviews.length === 0 ? (
              <p
                className="text-ink/55 py-6 text-center"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "0.9rem" }}
              >
                No reviews to show for this rating yet.
              </p>
            ) : (
              filteredReviews.map((review) => (
                <div key={review.id} className="glass-card p-6 flex gap-4">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold"
                    style={{ background: "#c9977a", fontFamily: "var(--font-manrope)", fontSize: "0.85rem" }}
                  >
                    {review.author
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-ink font-medium"
                        style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.1rem" }}
                      >
                        {review.author}
                      </span>
                      <span className="text-ink/40 text-xs">{review.date}</span>
                    </div>
                    <Stars rating={review.rating} size={11} />
                    <p
                      className="text-ink/65 leading-relaxed mt-2"
                      style={{ fontFamily: "var(--font-manrope)", fontSize: "0.88rem", fontWeight: 300 }}
                    >
                      {review.body}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}
