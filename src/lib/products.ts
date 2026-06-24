// Single source of truth for catalog data. This is placeholder content for the
// custom storefront — when Shopify is wired up, swap the `products`/`bundles`
// arrays (and the getters) for the Shopify Storefront API, keeping these types.

export interface Variant {
  /** Stable id used to build the variant-aware cart key, e.g. "60ct". */
  id: string;
  label: string;
  price: number;
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number; // 1–5
  date: string; // human-readable placeholder
  body: string;
}

export interface Product {
  /** Namespaced cart key, e.g. "product:1" — never a bare number (see CartContext). */
  id: string;
  /** Route param for the detail page, e.g. "glow-collagen-blend". */
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  reviews: number;
  image: string;
  /** Gallery images for the detail page (first is the primary). */
  gallery: string[];
  /** Long-form copy for the detail page. */
  description: string;
  badge: string | null;
  badgeColor: string | null;
  tags: string[];
  variants: Variant[];
  reviewList: ProductReview[];
}

export interface Bundle {
  /** Bundle slug; cart key is built as `bundle:${id}`. */
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  originalPrice: number;
  savings: string;
  products: string[];
  bg: string;
  accentColor: string;
  image: string;
}

export const products: Product[] = [
  {
    id: "product:1",
    slug: "glow-collagen-blend",
    name: "Glow Collagen Blend",
    category: "Beauty Support",
    price: 54,
    originalPrice: 68,
    rating: 4.9,
    reviews: 247,
    image: "/images/item-1.jpeg",
    gallery: ["/images/item-1.jpeg", "/images/inspo-1.jpeg", "/images/inspo-3.jpeg"],
    description:
      "A marine-collagen and beauty-vitamin blend formulated to support skin elasticity, hair strength, and nail resilience. Lightly berry-flavoured, it dissolves clean into water or your morning smoothie — no chalk, no aftertaste.",
    badge: "Best Seller",
    badgeColor: "#c9977a",
    tags: ["Skin", "Hair", "Nails"],
    variants: [
      { id: "30ct", label: "30 servings", price: 54 },
      { id: "60ct", label: "60 servings", price: 92 },
    ],
    reviewList: [
      {
        id: "r1",
        author: "Amara K.",
        rating: 5,
        date: "3 weeks ago",
        body: "Three weeks in and my skin genuinely looks more luminous. Mixes clean, tastes lovely.",
      },
      {
        id: "r2",
        author: "Lebo M.",
        rating: 5,
        date: "1 month ago",
        body: "My nails stopped peeling for the first time in years. Sold for life.",
      },
      {
        id: "r3",
        author: "Tasha R.",
        rating: 4,
        date: "2 months ago",
        body: "Lovely product — would love a larger size for the price, but the results speak for themselves.",
      },
    ],
  },
  {
    id: "product:2",
    slug: "plant-protein-luxe",
    name: "Plant Protein Luxe",
    category: "Performance",
    price: 62,
    originalPrice: null,
    rating: 4.8,
    reviews: 189,
    image: "/images/item-2.jpeg",
    gallery: ["/images/item-2.jpeg", "/images/inspo-2.jpeg", "/images/inspo-4.jpeg"],
    description:
      "A silky 20g plant-protein blend of pea and brown rice, rounded out with adaptogens for recovery. Clean ingredients, no bloat, and a vanilla finish that actually tastes like dessert.",
    badge: "New",
    badgeColor: "#4361ee",
    tags: ["Protein", "Recovery", "Clean"],
    variants: [
      { id: "500g", label: "500g pouch", price: 62 },
      { id: "1kg", label: "1kg pouch", price: 108 },
    ],
    reviewList: [
      {
        id: "r1",
        author: "Naledi P.",
        rating: 5,
        date: "2 weeks ago",
        body: "The only plant protein that hasn't upset my stomach. Blends smooth, no grit.",
      },
      {
        id: "r2",
        author: "Sam D.",
        rating: 4,
        date: "1 month ago",
        body: "Great macros and flavour. Wish it came in chocolate too!",
      },
    ],
  },
  {
    id: "product:3",
    slug: "morning-glow-ritual",
    name: "Morning Glow Ritual",
    category: "Wellness",
    price: 48,
    originalPrice: 58,
    rating: 5.0,
    reviews: 312,
    image: "/images/item-3.jpeg",
    gallery: ["/images/item-3.jpeg", "/images/inspo-3.jpeg", "/images/inspo-1.jpeg"],
    description:
      "A bright greens-and-energy blend designed for a calm, focused start. Adaptogenic mushrooms and B-vitamins lift the morning fog without the jitter of coffee.",
    badge: "Fan Fave",
    badgeColor: "#8b5e52",
    tags: ["Energy", "Mood", "Focus"],
    variants: [
      { id: "30ct", label: "30 servings", price: 48 },
      { id: "60ct", label: "60 servings", price: 82 },
    ],
    reviewList: [
      {
        id: "r1",
        author: "Zinhle T.",
        rating: 5,
        date: "1 week ago",
        body: "Replaced my second coffee with this. Focused all morning, no crash.",
      },
      {
        id: "r2",
        author: "Maya O.",
        rating: 5,
        date: "3 weeks ago",
        body: "Tastes green in the best way. My new non-negotiable.",
      },
    ],
  },
  {
    id: "product:4",
    slug: "recovery-rose-blend",
    name: "Recovery Rose Blend",
    category: "Recovery",
    price: 44,
    originalPrice: null,
    rating: 4.7,
    reviews: 156,
    image: "/images/item-4.jpeg",
    gallery: ["/images/item-4.jpeg", "/images/inspo-4.jpeg", "/images/inspo-2.jpeg"],
    description:
      "A calming evening blend of magnesium glycinate and botanicals to wind the body down and support overnight repair. A delicate rose finish makes it a ritual you'll look forward to.",
    badge: null,
    badgeColor: null,
    tags: ["Sleep", "Repair", "Calm"],
    variants: [
      { id: "30ct", label: "30 servings", price: 44 },
      { id: "60ct", label: "60 servings", price: 74 },
    ],
    reviewList: [
      {
        id: "r1",
        author: "Refilwe S.",
        rating: 5,
        date: "2 weeks ago",
        body: "I fall asleep faster and wake up less sore after training. Gentle and effective.",
      },
      {
        id: "r2",
        author: "Hannah B.",
        rating: 4,
        date: "1 month ago",
        body: "Lovely calming routine. The rose flavour is subtle and pretty.",
      },
    ],
  },
  {
    id: "product:5",
    slug: "strength-radiance",
    name: "Strength & Radiance",
    category: "Performance",
    price: 58,
    originalPrice: 72,
    rating: 4.9,
    reviews: 203,
    image: "/images/item-5.jpeg",
    gallery: ["/images/item-5.jpeg", "/images/inspo-2.jpeg", "/images/inspo-3.jpeg"],
    description:
      "A dual-action blend pairing creatine and iron with skin-loving antioxidants — built for women who train hard and want their glow to keep up. Unflavoured, mixes into anything.",
    badge: "Top Rated",
    badgeColor: "#c9977a",
    tags: ["Strength", "Glow", "Vitality"],
    variants: [
      { id: "30ct", label: "30 servings", price: 58 },
      { id: "90ct", label: "90 servings", price: 148 },
    ],
    reviewList: [
      {
        id: "r1",
        author: "Boitumelo N.",
        rating: 5,
        date: "1 week ago",
        body: "Stronger lifts within a month and my skin is glowing. Best of both worlds.",
      },
      {
        id: "r2",
        author: "Priya V.",
        rating: 5,
        date: "5 weeks ago",
        body: "Mixes into water with zero taste. Exactly what I wanted.",
      },
    ],
  },
];

export const bundles: Bundle[] = [
  {
    id: "glow",
    name: "Glow Bundle",
    tagline: "Radiance from within",
    description:
      "Collagen blend + beauty vitamins + hydration booster for skin that truly glows.",
    price: 128,
    originalPrice: 162,
    savings: "21% off",
    products: ["/images/item-1.jpeg", "/images/item-3.jpeg"],
    bg: "linear-gradient(135deg, #f9ede8 0%, #f3d5cb 100%)",
    accentColor: "#c9977a",
    image: "/images/inspo-1.jpeg",
  },
  {
    id: "recovery",
    name: "Recovery Bundle",
    tagline: "Rest. Repair. Rise.",
    description:
      "Sleep support + muscle repair blend + magnesium complex for deep recovery.",
    price: 106,
    originalPrice: 134,
    savings: "21% off",
    products: ["/images/item-4.jpeg", "/images/item-2.jpeg"],
    bg: "linear-gradient(135deg, #eff3ff 0%, #dce6fd 100%)",
    accentColor: "#4361ee",
    image: "/images/inspo-2.jpeg",
  },
  {
    id: "morning",
    name: "Morning Ritual Bundle",
    tagline: "Start with intention",
    description:
      "Energy blend + focus formula + morning greens for a luminous, powered start.",
    price: 118,
    originalPrice: 150,
    savings: "21% off",
    products: ["/images/item-3.jpeg", "/images/item-1.jpeg"],
    bg: "linear-gradient(135deg, #faf8f5 0%, #f3ede4 100%)",
    accentColor: "#a8845d",
    image: "/images/inspo-3.jpeg",
  },
  {
    id: "strength",
    name: "Strength Bundle",
    tagline: "Power. Performance. Pride.",
    description:
      "Plant protein + pre-workout blend + electrolytes for peak feminine strength.",
    price: 134,
    originalPrice: 172,
    savings: "22% off",
    products: ["/images/item-2.jpeg", "/images/item-5.jpeg"],
    bg: "linear-gradient(135deg, #f3ede4 0%, #e5d8c6 100%)",
    accentColor: "#8b5e52",
    image: "/images/inspo-4.jpeg",
  },
];

export const getProductBySlug = (slug: string): Product | undefined =>
  products.find((p) => p.slug === slug);

/** Same-category products first, then the rest, capped at 4. */
export const getRelatedProducts = (product: Product): Product[] =>
  products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .concat(products.filter((p) => p.id !== product.id && p.category !== product.category))
    .slice(0, 4);
