"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, ShoppingBag, Heart, Check } from "lucide-react";
import { fadeUp, staggerContainer, staggerContainerSlow } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import ShopifyProductCard from "@/components/ShopifyProductCard";
import { defaultVariant, isSoldOut, toCartItem, type ShopifyProduct } from "@/lib/shopify";

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

export default function ProductDetailContent({
  product,
  related,
}: {
  product: ShopifyProduct;
  related: ShopifyProduct[];
}) {
  const gallery = product.gallery?.length ? product.gallery : [product.image];
  const variants = product.variants ?? [];

  const [activeImage, setActiveImage] = useState(gallery[0]);
  const [variant, setVariant] = useState(() => defaultVariant(product));
  const [added, setAdded] = useState(false);

  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const wished = isWishlisted(product.id);

  const soldOut = isSoldOut(product);
  const price = variant?.price ?? product.price;
  // Shopify's compareAtPrice is a product-level range, so it only lines up with
  // the variant the range was derived from — show it on the cheapest variant.
  const showCompareAt =
    product.originalPrice != null && price === product.price;

  const handleAddToCart = () => {
    if (soldOut || variant?.availableForSale === false) return;
    addItem(toCartItem(product, variant));
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

  const unavailable = soldOut || variant?.availableForSale === false;

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
              <Image
                src={activeImage}
                alt={product.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </motion.div>

            {gallery.length > 1 && (
              <motion.div variants={fadeUp} className="flex gap-3">
                {gallery.map((img) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(img)}
                    className={cn(
                      "relative w-20 h-24 rounded-xl overflow-hidden flex-shrink-0 transition-all",
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

            {/* Rating — only when the store publishes review metafields */}
            {product.rating != null && (
              <motion.div variants={fadeUp} className="flex items-center gap-2 mt-3">
                <Stars rating={product.rating} />
                <span className="text-ink/50 text-sm">
                  {product.rating}
                  {product.reviews != null && ` · ${product.reviews} reviews`}
                </span>
              </motion.div>
            )}

            <motion.div variants={fadeUp} className="flex items-baseline gap-3 mt-5">
              <span
                className="heading-serif text-ink"
                style={{ fontFamily: "var(--font-cormorant)", fontSize: "2rem" }}
              >
                {formatPrice(price)}
              </span>
              {showCompareAt && (
                <span className="text-ink/35 text-lg line-through">
                  {formatPrice(product.originalPrice!)}
                </span>
              )}
            </motion.div>

            {product.description && (
              <motion.p
                variants={fadeUp}
                className="text-ink/65 leading-relaxed mt-5 whitespace-pre-line"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "0.95rem", fontWeight: 300 }}
              >
                {product.description}
              </motion.p>
            )}

            {/* Variants — a single-variant product has nothing to choose */}
            {variants.length > 1 && (
              <motion.div variants={fadeUp} className="mt-7">
                <p className="label-caps text-ink/55 mb-3" style={{ fontSize: "10px" }}>
                  Size
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVariant(v)}
                      disabled={!v.availableForSale}
                      className={cn(
                        "px-4 py-2.5 rounded-full text-sm transition-all",
                        variant?.id === v.id
                          ? "bg-rose-gold text-white"
                          : "text-ink/70 hover:text-ink",
                        !v.availableForSale && "opacity-40 cursor-not-allowed line-through"
                      )}
                      style={
                        variant?.id === v.id
                          ? { fontFamily: "var(--font-manrope)" }
                          : {
                              fontFamily: "var(--font-manrope)",
                              background: "rgba(201,151,122,0.08)",
                              border: "1px solid rgba(201,151,122,0.25)",
                            }
                      }
                    >
                      {v.label} · {formatPrice(v.price)}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div variants={fadeUp} className="flex items-center gap-3 mt-8">
              <button
                onClick={handleAddToCart}
                disabled={unavailable}
                className={cn(
                  "flex-1 py-4 rounded-full bg-rose-gold text-white font-semibold text-[11px] tracking-[0.13em] uppercase flex items-center justify-center gap-2 transition-transform",
                  unavailable
                    ? "opacity-45 cursor-not-allowed"
                    : "hover:scale-[1.01] active:scale-[0.99]"
                )}
                style={{
                  fontFamily: "var(--font-manrope)",
                  boxShadow: unavailable ? "none" : "0 6px 24px rgba(201,151,122,0.38)",
                }}
              >
                {unavailable ? (
                  "Sold Out"
                ) : added ? (
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
            {product.tags.length > 0 && (
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
            )}
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
                <ShopifyProductCard key={p.id} product={p} />
              ))}
            </motion.div>
          </div>
        </section>
      )}
    </>
  );
}
