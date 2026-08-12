// Catalog data layer. Every storefront surface (home featured grid, store grid,
// product detail) reads products from here, so Shopify is the single source of
// truth. When the store isn't configured we fall back to non-purchasable
// placeholders so the site still renders.

const PRODUCT_FRAGMENT = `
  fragment CatalogProduct on Product {
    id
    handle
    title
    description
    productType
    tags
    priceRange {
      minVariantPrice { amount currencyCode }
    }
    compareAtPriceRange {
      minVariantPrice { amount }
    }
    images(first: 5) {
      edges { node { url altText } }
    }
    variants(first: 20) {
      edges {
        node {
          id
          title
          availableForSale
          price { amount }
          compareAtPrice { amount }
        }
      }
    }
    rating: metafield(namespace: "reviews", key: "rating") { value }
    ratingCount: metafield(namespace: "reviews", key: "rating_count") { value }
  }
`;

const PRODUCTS_QUERY = `
  ${PRODUCT_FRAGMENT}
  query CatalogProducts {
    products(first: 50, sortKey: BEST_SELLING) {
      edges { node { ...CatalogProduct } }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = `
  ${PRODUCT_FRAGMENT}
  query CatalogProductByHandle($handle: String!) {
    product(handle: $handle) { ...CatalogProduct }
  }
`;

interface ShopifyVariantNode {
  id: string;
  title: string;
  availableForSale: boolean;
  price: { amount: string } | null;
  compareAtPrice: { amount: string } | null;
}

interface ShopifyProductNode {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
  } | null;
  compareAtPriceRange: {
    minVariantPrice: { amount: string };
  } | null;
  images: {
    edges: Array<{ node: { url: string; altText: string | null } }>;
  };
  variants: {
    edges: Array<{ node: ShopifyVariantNode }>;
  };
  rating: { value: string } | null;
  ratingCount: { value: string } | null;
}

export interface ShopifyVariant {
  /** Numeric Shopify variant id — the `#<variantId>` half of the cart key. */
  id: string;
  label: string;
  price: number;
  /**
   * This variant's own compare-at price, unlike `ShopifyProduct.originalPrice`
   * which is the product-level range and only lines up with the cheapest variant.
   */
  originalPrice: number | null;
  availableForSale: boolean;
}

export interface ShopifyProduct {
  /** Namespaced cart key, e.g. "product:1" — never a bare number (see CartContext). */
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number | null;
  image: string;
  tags: string[];
  /** Placeholders aren't purchasable: no cart, no wishlist, no detail page. */
  placeholder?: boolean;
  /** Shopify handle; enables the card's link to `/store/<slug>`. */
  slug?: string;
  description?: string;
  gallery?: string[];
  variants?: ShopifyVariant[];
  /** Only present when the store publishes the `reviews` metafields. */
  rating?: number;
  reviews?: number;
  /** Explicit badge label; falls back to a "Sale" badge when `originalPrice` is set. */
  badge?: string;
  badgeColor?: string;
}

/**
 * Marks a product for the store's featured showcase. A plain Shopify tag, so
 * merchandisers control the showcase from admin without a deploy, and the
 * development catalogue marks its picks the same way — one mechanism, both
 * sources. Filtered out of the tags a card displays (see `displayTags`).
 */
export const FEATURED_TAG = "featured";

export function isFeatured(product: ShopifyProduct): boolean {
  return product.tags.some((t) => t.toLowerCase() === FEATURED_TAG);
}

/** Tags a card should render: everything except the merchandising marker. */
export function displayTags(product: ShopifyProduct): string[] {
  return product.tags.filter((t) => t.toLowerCase() !== FEATURED_TAG).slice(0, 3);
}

/**
 * The store's featured showcase, in a stable order — never random, so the same
 * catalogue always yields the same shelf.
 *
 * Tagged products come first. If there aren't enough, it tops up from the rest in
 * catalogue order, which for Shopify is `sortKey: BEST_SELLING` — a real
 * merchandising signal rather than an arbitrary API ordering.
 */
export function getShowcaseProducts(
  all: ShopifyProduct[],
  count = 4
): ShopifyProduct[] {
  const tagged = all.filter(isFeatured);
  if (tagged.length >= count) return tagged.slice(0, count);
  const rest = all.filter((p) => !isFeatured(p));
  return [...tagged, ...rest].slice(0, count);
}

/**
 * Development catalogue switch (#68). ONLY the exact string "true" enables it —
 * anything else, including unset, means the real Shopify catalogue. Safe by
 * default, so a missing or misspelled value can never serve fake products.
 *
 * `NEXT_PUBLIC_*` is inlined at BUILD time, so this is a compile-time constant:
 * changing it on Netlify requires a new build, and in production mode the
 * `import()` below is dead code the bundler drops entirely.
 */
function usePlaceholderCatalogue(): boolean {
  return process.env.NEXT_PUBLIC_USE_PLACEHOLDER_PRODUCTS === "true";
}

/**
 * The "Coming Soon" tiles for a store with NO credentials at all. Unrelated to
 * the development catalogue in `placeholder-products.ts`, despite the name:
 * `placeholder: true` means non-purchasable, and ShopifyProductCard uses it to
 * strip every purchase control. Development-catalogue products must never set it.
 */
const placeholderProducts: ShopifyProduct[] = [
  { id: "product:1", name: "Glow Collagen Blend", category: "Beauty Support", price: 54, originalPrice: 68, image: "", tags: ["Skin", "Hair", "Nails"], placeholder: true },
  { id: "product:2", name: "Plant Protein Luxe", category: "Performance", price: 62, originalPrice: null, image: "", tags: ["Protein", "Recovery", "Clean"], placeholder: true },
  { id: "product:3", name: "Morning Glow Ritual", category: "Wellness", price: 48, originalPrice: 58, image: "", tags: ["Energy", "Mood", "Focus"], placeholder: true },
  { id: "product:4", name: "Recovery Rose Blend", category: "Recovery", price: 44, originalPrice: null, image: "", tags: ["Sleep", "Repair", "Calm"], placeholder: true },
  { id: "product:5", name: "Strength & Radiance", category: "Performance", price: 58, originalPrice: 72, image: "", tags: ["Strength", "Glow", "Vitality"], placeholder: true },
];

/** Trailing numeric segment of a Shopify gid, e.g. gid://…/Product/42 → "42". */
function gidToId(gid: string): string {
  return gid.split("/").pop() ?? "";
}

/** The `reviews.rating` metafield is JSON: {"value":"4.9","scale_max":"5.0",…}. */
function parseRating(raw: string | null | undefined): number | undefined {
  if (!raw) return undefined;
  let value = raw;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "value" in parsed) {
      value = String(parsed.value);
    }
  } catch {
    // Not JSON — treat the metafield as a bare number.
  }
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : undefined;
}

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN &&
      process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN
  );
}

async function shopifyFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T | null> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

  if (!domain || !token) return null;

  try {
    const response = await fetch(`${domain}/api/2026-04/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      // Freshness comes from the "products" tag, which Shopify's webhook busts
      // via /api/revalidate. The long window is only a safety net for a missed
      // webhook, so it stays hourly rather than adding origin load.
      next: { revalidate: 3600, tags: ["products"] },
    });

    if (!response.ok) {
      console.error("Shopify fetch error:", response.status);
      return null;
    }

    const json = await response.json();

    if (json.errors) {
      console.error("Shopify query errors:", json.errors);
      return null;
    }

    return (json.data as T) ?? null;
  } catch (err) {
    console.error("Shopify fetch failed:", err);
    return null;
  }
}

function toProduct(node: ShopifyProductNode): ShopifyProduct {
  const compareAmount = parseFloat(
    node.compareAtPriceRange?.minVariantPrice?.amount ?? "0"
  );
  const price = parseFloat(node.priceRange?.minVariantPrice?.amount ?? "0");
  const gallery = node.images.edges.map(({ node: img }) => img.url);
  const variants: ShopifyVariant[] = node.variants.edges.map(({ node: v }) => {
    const vPrice = parseFloat(v.price?.amount ?? "0");
    const vCompare = parseFloat(v.compareAtPrice?.amount ?? "0");
    return {
      id: gidToId(v.id),
      // Single-variant products in Shopify carry the synthetic "Default Title".
      label: v.title === "Default Title" ? node.title : v.title,
      price: vPrice,
      // Only a compare-at ABOVE the price is a discount; Shopify lets merchants
      // set it equal to the price, which is not a sale.
      originalPrice: vCompare > vPrice ? vCompare : null,
      availableForSale: v.availableForSale,
    };
  });

  return {
    id: `product:${gidToId(node.id)}`,
    slug: node.handle,
    name: node.title,
    category: node.productType || "Product",
    description: node.description,
    price,
    originalPrice: compareAmount > price ? compareAmount : null,
    image: gallery[0] ?? "/images/item-1.jpeg",
    gallery,
    // Kept whole: the 3-tag cap is a card concern, and slicing here would drop a
    // `featured` marker before `isFeatured` ever saw it. See `displayTags`.
    tags: node.tags,
    variants,
    rating: parseRating(node.rating?.value),
    reviews: node.ratingCount?.value
      ? parseInt(node.ratingCount.value, 10)
      : undefined,
  };
}

/** The full catalog, best-selling first. Empty when Shopify errors. */
export async function getProducts(): Promise<ShopifyProduct[]> {
  // Dynamic so the development catalogue is only ever loaded in development
  // mode — and, since the flag is inlined at build time, is dropped from the
  // production bundle altogether. It also breaks the import cycle: that module
  // imports FEATURED_TAG from this one.
  if (usePlaceholderCatalogue()) {
    return (await import("./placeholder-products")).placeholderCatalogue;
  }

  const data = await shopifyFetch<{
    products: { edges: Array<{ node: ShopifyProductNode }> };
  }>(PRODUCTS_QUERY);

  // `data === null` is the unconfigured/errored path. The `products` check is
  // separate: a 200 carrying `{"data":{}}` would otherwise reach the map below
  // and throw OUTSIDE shopifyFetch's try. This guard belongs here rather than in
  // shopifyFetch because that helper now serves two queries, and the other one
  // (`product(handle:)`) returns a null root field legitimately — for any handle
  // Shopify doesn't know. Any future query must bring its own root-field check.
  if (data === null || !data.products?.edges) {
    // No Shopify credentials yet — show the "Coming Soon" placeholders. A
    // configured store that errored returns an empty grid instead of fake
    // products (shopifyFetch has already logged the cause).
    return isConfigured() ? [] : placeholderProducts;
  }

  return data.products.edges.map(({ node }) => toProduct(node));
}

/** Home page grid — the five best sellers. */
export async function getFeaturedProducts(): Promise<ShopifyProduct[]> {
  const products = await getProducts();
  return products.slice(0, 5);
}

export async function getProductBySlug(
  slug: string
): Promise<ShopifyProduct | null> {
  // Must honour the switch too, or every development-catalogue card 404s the
  // moment someone clicks it.
  if (usePlaceholderCatalogue()) {
    const { placeholderCatalogue } = await import("./placeholder-products");
    return placeholderCatalogue.find((p) => p.slug === slug) ?? null;
  }

  const data = await shopifyFetch<{ product: ShopifyProductNode | null }>(
    PRODUCT_BY_HANDLE_QUERY,
    { handle: slug }
  );

  return data?.product ? toProduct(data.product) : null;
}

/** Same-category products first, then the rest, capped at 4. */
export function getRelatedProducts(
  product: ShopifyProduct,
  all: ShopifyProduct[]
): ShopifyProduct[] {
  const others = all.filter((p) => p.id !== product.id && !p.placeholder);
  return others
    .filter((p) => p.category === product.category)
    .concat(others.filter((p) => p.category !== product.category))
    .slice(0, 4);
}

/** The variant a card's quick-add should use: first in stock, else the first. */
export function defaultVariant(
  product: ShopifyProduct
): ShopifyVariant | undefined {
  return (
    product.variants?.find((v) => v.availableForSale) ?? product.variants?.[0]
  );
}

export function isSoldOut(product: ShopifyProduct): boolean {
  const variants = product.variants;
  // A product with no variant data (e.g. a placeholder) isn't "sold out".
  return !!variants?.length && variants.every((v) => !v.availableForSale);
}

/**
 * Builds a cart line for a product/variant pair. Variant-specific lines append
 * `#<variantId>` to the product key so two sizes of the same product are
 * distinct rows in the bag (see CartContext).
 */
export function toCartItem(product: ShopifyProduct, variant?: ShopifyVariant) {
  const v = variant ?? defaultVariant(product);
  const hasChoice = (product.variants?.length ?? 0) > 1;

  return {
    id: v ? `${product.id}#${v.id}` : product.id,
    name: hasChoice && v ? `${product.name} — ${v.label}` : product.name,
    category: product.category,
    price: v?.price ?? product.price,
    image: product.image,
  };
}
