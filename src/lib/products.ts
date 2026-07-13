// Bundle data. Products now come from Shopify (`src/lib/shopify.ts`); bundles
// are a merchandising construct with no Shopify equivalent yet, so they remain
// placeholder content until they're modelled as Shopify products or a
// collection.

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
