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
  const variants: ShopifyVariant[] = node.variants.edges.map(({ node: v }) => ({
    id: gidToId(v.id),
    // Single-variant products in Shopify carry the synthetic "Default Title".
    label: v.title === "Default Title" ? node.title : v.title,
    price: parseFloat(v.price?.amount ?? "0"),
    availableForSale: v.availableForSale,
  }));

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
    tags: node.tags.slice(0, 3),
    variants,
    rating: parseRating(node.rating?.value),
    reviews: node.ratingCount?.value
      ? parseInt(node.ratingCount.value, 10)
      : undefined,
  };
}

/** The full catalog, best-selling first. Empty when Shopify errors. */
export async function getProducts(): Promise<ShopifyProduct[]> {
  const data = await shopifyFetch<{
    products: { edges: Array<{ node: ShopifyProductNode }> };
  }>(PRODUCTS_QUERY);

  if (data === null) {
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
