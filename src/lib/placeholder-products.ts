// Development product catalogue (issue #68).
//
// Used ONLY when NEXT_PUBLIC_USE_PLACEHOLDER_PRODUCTS === "true", via the single
// guarded branch in `src/lib/shopify.ts`. Nothing else may import this module —
// keeping it to one import site is what stops development data reaching
// production. See `usePlaceholderCatalogue()` there.
//
// ─────────────────────────────────────────────────────────────────────────────
// DO NOT SET `placeholder: true` ON ANYTHING IN THIS FILE.
//
// `ShopifyProduct.placeholder` means something else entirely: a non-purchasable
// "Coming Soon" tile shown when the store has no credentials at all, which
// ShopifyProductCard uses to strip every purchase control. These products are the
// opposite — fake data that must behave EXACTLY like real Shopify products so the
// storefront components get genuinely exercised. Two different ideas, unhappily
// similar names.
// ─────────────────────────────────────────────────────────────────────────────
//
// The catalogue is deliberately awkward, not a happy path: it carries sold-out
// stock, single- and multi-variant products, discounts and full prices, missing
// ratings, missing badges, and long names that test card typography. Anything the
// real storefront can encounter should be representable here.

import { FEATURED_TAG, type ShopifyProduct } from "./product";

/**
 * Ids sit in a 9000 block so a development product is obvious on sight in a cart
 * key, a URL, or a log line. Real Shopify product ids are far larger.
 */
export const placeholderCatalogue: ShopifyProduct[] = [
  {
    id: "product:9001",
    slug: "glow-collagen-blend",
    name: "Glow Collagen Blend",
    category: "Beauty",
    description:
      "Marine collagen peptides with vitamin C and biotin, blended for skin that looks rested and hair that feels stronger. Stir into coffee, smoothies or simply water.",
    price: 549,
    originalPrice: 689,
    image: "/images/item-1.jpeg",
    gallery: ["/images/item-1.jpeg", "/images/item-3.jpeg"],
    tags: [FEATURED_TAG, "Skin", "Hair", "Nails"],
    rating: 4.9,
    reviews: 128,
    variants: [
      { id: "90011", label: "30 servings", price: 549, originalPrice: 689, availableForSale: true },
      { id: "90012", label: "60 servings", price: 949, originalPrice: 1199, availableForSale: true },
    ],
  },
  {
    id: "product:9002",
    slug: "hey-beautiful-plant-protein",
    name: "Hey Beautiful Plant Protein",
    category: "Protein",
    description:
      "A complete plant protein from pea and brown rice, 24g per serving, with digestive enzymes so it sits light. No chalk, no bloat.",
    price: 649,
    originalPrice: null,
    image: "/images/item-2.jpeg",
    gallery: ["/images/item-2.jpeg", "/images/item-5.jpeg"],
    tags: [FEATURED_TAG, "Protein", "Vegan"],
    rating: 4.8,
    reviews: 94,
    variants: [
      { id: "90021", label: "Vanilla Bean", price: 649, originalPrice: null, availableForSale: true },
      { id: "90022", label: "Cacao", price: 649, originalPrice: null, availableForSale: true },
      { id: "90023", label: "Berry", price: 649, originalPrice: null, availableForSale: false },
    ],
  },
  {
    id: "product:9003",
    slug: "morning-glow-ritual",
    name: "Morning Glow Ritual",
    category: "Wellness",
    description:
      "Greens, adaptogens and B-vitamins for a start that feels steady rather than spiked. Designed to be the first thing you reach for.",
    price: 429,
    originalPrice: 519,
    image: "/images/item-3.jpeg",
    gallery: ["/images/item-3.jpeg", "/images/item-1.jpeg"],
    tags: [FEATURED_TAG, "Energy", "Focus"],
    rating: 4.7,
    reviews: 62,
    badge: "Bestseller",
    variants: [
      { id: "90031", label: "Morning Glow Ritual", price: 429, originalPrice: 519, availableForSale: true },
    ],
  },
  {
    id: "product:9004",
    slug: "deep-recovery-magnesium-complex",
    // Deliberately long — checks card title wrapping at every breakpoint.
    name: "Deep Recovery Magnesium Complex with Ashwagandha",
    category: "Recovery",
    description:
      "Magnesium glycinate and ashwagandha to ease the body down at the end of the day. Take an hour before bed.",
    price: 389,
    originalPrice: null,
    image: "/images/item-4.jpeg",
    gallery: ["/images/item-4.jpeg", "/images/item-2.jpeg"],
    tags: [FEATURED_TAG, "Sleep", "Calm"],
    rating: 4.9,
    reviews: 210,
    variants: [
      { id: "90041", label: "Deep Recovery Magnesium Complex", price: 389, originalPrice: null, availableForSale: true },
    ],
  },
  {
    id: "product:9005",
    slug: "radiance-marine-collagen",
    name: "Radiance Marine Collagen",
    category: "Beauty",
    description:
      "Our highest-concentration marine collagen. The trial size is popular and goes out of stock often — the full size is the better value anyway.",
    price: 399,
    // Product-level compare-at describes the CHEAPEST variant, which has no
    // discount — so this is null even though a pricier variant IS discounted.
    // That divergence is the whole point of this product: see the note below.
    originalPrice: null,
    image: "/images/item-5.jpeg",
    gallery: ["/images/item-5.jpeg", "/images/item-4.jpeg"],
    tags: ["Skin", "Glow"],
    variants: [
      // The cheapest variant is sold out, so `defaultVariant()` skips it and
      // selects the R749 one — which IS discounted. Before #62's per-variant
      // `compareAtPrice` fix the strikethrough silently vanished here, because the
      // detail page compared against the product-level range above. The real
      // Shopify catalogue still has no product that reproduces this.
      { id: "90051", label: "Trial · 14 servings", price: 399, originalPrice: null, availableForSale: false },
      { id: "90052", label: "Full · 60 servings", price: 749, originalPrice: 899, availableForSale: true },
    ],
  },
  {
    id: "product:9006",
    slug: "everyday-multivitamin",
    name: "Everyday Multivitamin",
    category: "Supplements",
    description:
      "The unglamorous one that quietly does the work. A full-spectrum daily multivitamin with iron and folate.",
    price: 299,
    originalPrice: null,
    image: "/images/item-1.jpeg",
    gallery: ["/images/item-1.jpeg", "/images/item-2.jpeg"],
    tags: ["Daily", "Essentials"],
    rating: 4.6,
    reviews: 340,
    variants: [
      { id: "90061", label: "Everyday Multivitamin", price: 299, originalPrice: null, availableForSale: true },
    ],
  },
  {
    // Short name, no rating, no badge, no discount — the plainest card state.
    id: "product:9007",
    slug: "calm",
    name: "Calm",
    category: "Wellness",
    description:
      "L-theanine and lemon balm for the middle of a long day. Not a sedative — it takes the edge off without dulling anything.",
    price: 249,
    originalPrice: null,
    image: "/images/item-3.jpeg",
    gallery: ["/images/item-3.jpeg", "/images/item-5.jpeg"],
    tags: ["Calm"],
    variants: [
      { id: "90071", label: "Calm", price: 249, originalPrice: null, availableForSale: true },
    ],
  },
  {
    id: "product:9008",
    slug: "sleep-and-restore-botanical-blend",
    name: "Sleep & Restore Botanical Blend",
    category: "Recovery",
    description:
      "Valerian, passionflower and magnesium in a warm night-time blend. Steep it, drink it, sleep.",
    price: 459,
    originalPrice: 549,
    image: "/images/item-4.jpeg",
    gallery: ["/images/item-4.jpeg", "/images/item-3.jpeg"],
    tags: ["Sleep", "Night"],
    rating: 4.8,
    reviews: 88,
    variants: [
      { id: "90081", label: "Sleep & Restore Botanical Blend", price: 459, originalPrice: 549, availableForSale: true },
    ],
  },
  {
    // Every variant unavailable → isSoldOut() true → Sold Out pill, no controls.
    id: "product:9009",
    slug: "iron-b12-support",
    name: "Iron + B12 Support",
    category: "Supplements",
    description:
      "Gentle chelated iron with B12 and vitamin C for absorption. Restocking shortly.",
    price: 279,
    originalPrice: null,
    image: "/images/item-2.jpeg",
    gallery: ["/images/item-2.jpeg", "/images/item-1.jpeg"],
    tags: ["Iron", "Energy"],
    rating: 4.7,
    reviews: 71,
    variants: [
      { id: "90091", label: "60 capsules", price: 279, originalPrice: null, availableForSale: false },
      { id: "90092", label: "120 capsules", price: 499, originalPrice: null, availableForSale: false },
    ],
  },
  {
    // Cents — exercises formatPrice's "R 219,99" branch, which the real
    // catalogue had no product to test until recently.
    id: "product:9010",
    slug: "hydration-electrolyte-sachets",
    name: "Hydration Electrolyte Sachets",
    category: "Wellness",
    description:
      "Sodium, potassium and magnesium without the sugar load. One sachet in 500ml of water.",
    price: 219.99,
    originalPrice: null,
    image: "/images/item-5.jpeg",
    gallery: ["/images/item-5.jpeg", "/images/item-3.jpeg"],
    tags: ["Hydration", "Training"],
    rating: 4.5,
    reviews: 51,
    variants: [
      { id: "90101", label: "Citrus · 14 sachets", price: 219.99, originalPrice: null, availableForSale: true },
      { id: "90102", label: "Berry · 14 sachets", price: 219.99, originalPrice: null, availableForSale: true },
    ],
  },
  {
    id: "product:9011",
    slug: "beauty-sleep-silk-complex",
    name: "Beauty Sleep Silk Complex",
    category: "Beauty",
    description:
      "An overnight blend of silk protein peptides and hyaluronic acid, taken rather than applied.",
    price: 599,
    originalPrice: null,
    image: "/images/item-1.jpeg",
    gallery: ["/images/item-1.jpeg", "/images/item-4.jpeg"],
    tags: ["Overnight", "Skin"],
    badge: "New",
    variants: [
      { id: "90111", label: "Beauty Sleep Silk Complex", price: 599, originalPrice: null, availableForSale: true },
    ],
  },
  {
    id: "product:9012",
    slug: "pre-workout-bloom",
    name: "Pre-Workout Bloom",
    category: "Protein",
    description:
      "Beetroot, citrulline and a modest 90mg of green-tea caffeine. Enough to start, not enough to jitter.",
    price: 479,
    originalPrice: 559,
    image: "/images/item-2.jpeg",
    gallery: ["/images/item-2.jpeg", "/images/item-4.jpeg"],
    tags: ["Training", "Energy"],
    rating: 4.4,
    reviews: 37,
    variants: [
      { id: "90121", label: "Pink Grapefruit", price: 479, originalPrice: 559, availableForSale: true },
      { id: "90122", label: "Watermelon", price: 479, originalPrice: 559, availableForSale: true },
    ],
  },
  {
    id: "product:9013",
    slug: "greens-and-glow-daily-powder",
    name: "Greens & Glow Daily Powder",
    category: "Supplements",
    description:
      "Spirulina, wheatgrass and spinach with a mint finish so it actually tastes of something you'd choose.",
    price: 519,
    originalPrice: null,
    image: "/images/item-3.jpeg",
    gallery: ["/images/item-3.jpeg", "/images/item-2.jpeg"],
    tags: ["Greens", "Daily"],
    rating: 4.7,
    reviews: 143,
    variants: [
      { id: "90131", label: "Greens & Glow Daily Powder", price: 519, originalPrice: null, availableForSale: true },
    ],
  },
  {
    id: "product:9014",
    slug: "rose-recovery-body-butter",
    name: "Rose Recovery Body Butter",
    category: "Recovery",
    description:
      "Shea and rosehip for post-training skin. The one product here you put on rather than in.",
    price: 189,
    originalPrice: null,
    image: "/images/item-4.jpeg",
    gallery: ["/images/item-4.jpeg", "/images/item-5.jpeg"],
    tags: ["Body", "Rose"],
    variants: [
      { id: "90141", label: "Rose Recovery Body Butter", price: 189, originalPrice: null, availableForSale: true },
    ],
  },
];
