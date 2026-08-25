// The shared product model and the pure helpers around it.
//
// Deliberately separate from `shopify.ts`: this module is safe in a client
// bundle, that one is not. Product cards, the detail page and the store grid all
// run in the browser and only need the shape plus a few pure functions — they
// must never pull in the Storefront queries or the development catalogue behind
// them. Keeping data fetching out of the presentation path is what stops that
// happening by accident (issue #68).
//
// Import rule of thumb:
//   "use client" component  -> @/lib/product
//   server page / fetching  -> @/lib/shopify (which re-uses these types)

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
  /**
   * "Coming Soon" tile for a store with NO credentials: not purchasable, no cart,
   * no wishlist, no detail page. NOT related to the development catalogue in
   * `placeholder-products.ts`, which must never set this — those products are
   * meant to behave exactly like real ones.
   */
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
 * A bag line before the cart adds a quantity. Named so other surfaces can carry
 * one around verbatim rather than rebuilding the id by hand — the wishlist does
 * exactly that, which is what stops it opening a second row for a product the
 * card already added (#63).
 */
export interface CartLine {
  id: string;
  /**
   * Numeric Shopify variant id — the same value the `#<variantId>` half of `id`
   * already carries, exposed as a field so nothing has to split the key back
   * apart to reach it (#92). Numeric, not a gid: `shopify.ts` stores the trailing
   * segment, and the checkout handoff rebuilds
   * `gid://shopify/ProductVariant/<id>` at mutation time.
   *
   * `null` means the line has no Shopify variant and therefore cannot be bought.
   * Required rather than optional — unlike `WishlistProduct.cartLine?`, whose
   * optionality exists purely for the persisted shape — so the compiler
   * enumerates every producer. #31 must reject `null` rather than assume.
   */
  variantId: string | null;
  name: string;
  category: string;
  price: number;
  image: string;
}

/**
 * Builds a cart line for a product/variant pair. Variant-specific lines append
 * `#<variantId>` to the product key so two sizes of the same product are
 * distinct rows in the bag (see CartContext).
 *
 * This is the ONLY place a cart id is constructed. Anything that needs one must
 * come through here or carry a `CartLine` built here.
 */
export function toCartItem(
  product: ShopifyProduct,
  variant?: ShopifyVariant
): CartLine {
  const v = variant ?? defaultVariant(product);
  const hasChoice = (product.variants?.length ?? 0) > 1;

  return {
    id: v ? `${product.id}#${v.id}` : product.id,
    // Defensive rather than load-bearing: `v` is only undefined for a product
    // with no variants, which today means the unconfigured-store "Coming Soon"
    // tiles — and those already have every purchase control stripped, so they
    // never reach the bag. TypeScript can't prove that, and #31 shouldn't trust it.
    variantId: v?.id ?? null,
    name: hasChoice && v ? `${product.name} — ${v.label}` : product.name,
    category: product.category,
    price: v?.price ?? product.price,
    image: product.image,
  };
}
