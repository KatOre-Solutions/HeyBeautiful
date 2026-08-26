// Catalog data layer — Storefront API fetching. Every storefront surface (home
// featured grid, store grid, product detail) reads products from here, so Shopify
// is the single source of truth. When the store isn't configured we fall back to
// non-purchasable placeholders so the site still renders.
//
// SERVER ONLY. The product shape and the pure helpers live in `./product`, which
// is what client components import. Keeping them apart matters: this module
// reaches the Storefront queries and the development catalogue, and a client
// component importing it drags all of that into the browser bundle (#68).

import type { ShopifyProduct, ShopifyVariant } from "./product";

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

/**
 * Development catalogue switch (#68). ONLY the exact string "true" enables it —
 * anything else, including unset, means the real Shopify catalogue. Safe by
 * default, so a missing or misspelled value can never serve fake products.
 *
 * `NEXT_PUBLIC_*` is inlined at BUILD time, so this is a compile-time constant:
 * changing it on Netlify requires a new build, and in production mode the
 * `import()` below is dead code the bundler drops entirely.
 */
function placeholderCatalogueEnabled(): boolean {
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

/**
 * Storefront API version. Every Shopify surface must agree on this: the webhooks
 * registered in admin are signed against the version they were registered for,
 * so a mismatch changes the payload shape (see `.env.example`).
 */
const API_VERSION = "2026-04";

/** Storefront GraphQL endpoint. `domain` must already carry its scheme. */
function endpoint(domain: string): string {
  return `${domain}/api/${API_VERSION}/graphql.json`;
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
    const response = await fetch(endpoint(domain), {
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
  if (placeholderCatalogueEnabled()) {
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
  if (placeholderCatalogueEnabled()) {
    const { placeholderCatalogue } = await import("./placeholder-products");
    return placeholderCatalogue.find((p) => p.slug === slug) ?? null;
  }

  const data = await shopifyFetch<{ product: ShopifyProductNode | null }>(
    PRODUCT_BY_HANDLE_QUERY,
    { handle: slug }
  );

  return data?.product ? toProduct(data.product) : null;
}

// ─── Checkout handoff (#31) ────────────────────────────────────────────────
//
// The bag is turned into a Shopify cart and the shopper is sent to the
// `checkoutUrl` Shopify returns. Shopify then owns payment, PCI scope, tax,
// shipping rates and the order record — none of that belongs in this repo, and
// the payment gateway (PayFast) is configured in the Shopify admin, not here.

/**
 * A bag line, reduced to what Shopify needs. `variantId` is the NUMERIC id the
 * cart carries (#92); the gid is rebuilt below — the inverse of `gidToId`.
 */
export interface CheckoutLine {
  variantId: string;
  quantity: number;
}

/** Discriminated result so callers never handle GraphQL shapes. */
export type CreateCartResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; reason: "unconfigured" | "transport" | "rejected" };

/**
 * NOTE the response selection: `cart { checkoutUrl }` and nothing else.
 *
 * A cart id is `gid://shopify/Cart/<token>?key=<secret>` — Shopify's docs say to
 * treat that key like a password and keep it out of client-side code. We never
 * need it (the cart is created and immediately handed off), so it is never
 * selected, and therefore can't leak through this route by accident.
 */
const CART_CREATE_MUTATION = `
  mutation CreateCart($lines: [CartLineInput!]!, $buyerIdentity: CartBuyerIdentityInput) {
    cartCreate(input: { lines: $lines, buyerIdentity: $buyerIdentity }) {
      cart { checkoutUrl }
      userErrors { field message }
    }
  }
`;

interface CartCreateResponse {
  cartCreate: {
    cart: { checkoutUrl: string } | null;
    userErrors: Array<{ field: string[] | null; message: string }>;
  } | null;
}

/**
 * Sibling of `shopifyFetch` for mutations.
 *
 * Deliberately NOT `shopifyFetch`: that helper sets
 * `next: { revalidate: 3600, tags: ["products"] }`, which would cache a cart
 * creation for an hour and hang it off the products tag — so two shoppers could
 * be handed the same checkout. `cache: "no-store"` is the whole point.
 */
async function storefrontMutate<T>(
  query: string,
  variables: Record<string, unknown>,
  buyerIp?: string
): Promise<T | null> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

  if (!domain || !token) return null;

  // Shopify meters a public Storefront token PER CLIENT IP. Server-side calls
  // would otherwise all be attributed to this server's IP — one shared bucket for
  // every shopper's cart AND the catalogue reads in `shopifyFetch`, so a flood of
  // cart creations could throttle `getProducts()` and empty the store's grid.
  // Forwarding the buyer's IP is Shopify's documented remedy for exactly this.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Shopify-Storefront-Access-Token": token,
  };

  if (buyerIp) headers["Shopify-Storefront-Buyer-IP"] = buyerIp;

  try {
    const response = await fetch(endpoint(domain), {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Shopify mutation error:", response.status);
      return null;
    }

    const json = await response.json();

    if (json.errors) {
      console.error("Shopify mutation query errors:", json.errors);
      return null;
    }

    return (json.data as T) ?? null;
  } catch (err) {
    console.error("Shopify mutation failed:", err);
    return null;
  }
}

/**
 * Creates a Shopify cart and returns its checkout URL.
 *
 * `email` is a checkout PREFILL, not an identity claim — it reaches this
 * function from the browser, and #57 is explicit that a client-sent value is not
 * a trust boundary. Shopify collects and owns the authoritative order details
 * regardless; the only effect of a wrong value here is a wrong prefill.
 */
export async function createCart(
  lines: CheckoutLine[],
  email?: string,
  buyerIp?: string
): Promise<CreateCartResult> {
  if (!isConfigured()) return { ok: false, reason: "unconfigured" };

  const data = await storefrontMutate<CartCreateResponse>(
    CART_CREATE_MUTATION,
    {
      lines: lines.map((l) => ({
        merchandiseId: `gid://shopify/ProductVariant/${l.variantId}`,
        quantity: l.quantity,
      })),
      buyerIdentity: email ? { email } : undefined,
    },
    buyerIp
  );

  if (data === null) return { ok: false, reason: "transport" };

  // `userErrors` is where the Cart API reports business failures — a variant that
  // doesn't exist, is unpublished, or is out of stock. They arrive INSIDE `data`
  // with a 200, so the `json.errors` check above never sees them. Missing this is
  // the classic way a broken checkout looks like a working one.
  const payload = data.cartCreate;
  const userErrors = payload?.userErrors ?? [];

  if (userErrors.length > 0) {
    console.error("Shopify cartCreate userErrors:", userErrors);
    return { ok: false, reason: "rejected" };
  }

  const checkoutUrl = payload?.cart?.checkoutUrl;

  if (!checkoutUrl) {
    console.error("Shopify cartCreate returned no checkoutUrl");
    return { ok: false, reason: "rejected" };
  }

  return { ok: true, checkoutUrl };
}

/**
 * Fails closed on anything that isn't a Shopify checkout URL.
 *
 * `src/lib/redirect.ts` is the security boundary for INTERNAL destinations and
 * rejects every absolute URL by design, so routing this through it would rewrite
 * a valid checkout to `/account`. This is the outbound equivalent: the value is
 * about to become a top-level navigation, so an unexpected host must not be
 * followed.
 */
function hostOf(value: string | undefined): string {
  if (!value) return "";
  try {
    return new URL(value).host;
  } catch {
    return "";
  }
}

/** Shopify-owned hosts. Note `*.myshopify.com` needs its own arm: the string
 *  "shop.myshopify.com" does NOT end with ".shopify.com". */
function isShopifyOwnedHost(host: string): boolean {
  return (
    host === "shopify.com" ||
    host.endsWith(".shopify.com") ||
    host.endsWith(".myshopify.com")
  );
}

export function isValidCheckoutUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  if (url.protocol !== "https:") return false;

  if (isShopifyOwnedHost(url.host)) return true;

  // Shopify returns `checkoutUrl` on the shop's PRIMARY domain, which is not
  // necessarily the host the API request went to. A store with a custom primary
  // domain hands back `https://shop.example.co.za/cart/c/…`, which is neither the
  // configured `*.myshopify.com` API domain nor a Shopify-owned host — so without
  // this arm every checkout would be rejected the day a real domain is attached
  // (#18). Set NEXT_PUBLIC_SHOPIFY_CHECKOUT_DOMAIN to that primary domain.
  const configured = [
    hostOf(process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT_DOMAIN),
    hostOf(process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN),
  ].filter((h) => h !== "");

  if (configured.length === 0) {
    // A domain set without its scheme parses to "" and would silently narrow the
    // allowlist. Say so rather than failing mysteriously at checkout.
    console.error(
      "No usable Shopify host configured — NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN must include its scheme (https://…)."
    );
  }

  return configured.includes(url.host);
}
