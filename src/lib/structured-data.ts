// schema.org JSON-LD builders (#14).
//
// Pure functions returning plain objects — no JSX and no I/O, so they can be exercised
// from a scratch script without a render. Rendering is `@/components/JsonLd`, which owns
// the escaping.

import {
  defaultVariant,
  isSoldOut,
  meaningfulCategory,
  type ShopifyProduct,
} from "@/lib/product";
import { absoluteUrl, siteUrl } from "@/lib/site";

const BRAND_NAME = "Hey Beautiful";

/** Shopify sells in ZAR — the same currency `formatPrice` renders. */
const CURRENCY = "ZAR";

const IN_STOCK = "https://schema.org/InStock";
const OUT_OF_STOCK = "https://schema.org/OutOfStock";

/**
 * Whether this build's rating data can be trusted enough to publish.
 *
 * The development catalogue (#68) hardcodes invented ratings — 4.9 from 128 reviews and
 * so on — purely so card typography can be exercised. Every real product currently
 * returns no review metafields at all. Emitting the invented numbers as `aggregateRating`
 * is precisely what Google issues a manual action for, and those are slow to reverse, so
 * ratings are only published when the real catalogue is the one being rendered.
 */
function ratingsAreReal(): boolean {
  return process.env.NEXT_PUBLIC_USE_PLACEHOLDER_PRODUCTS !== "true";
}

function productUrl(product: ShopifyProduct): string {
  return absoluteUrl(`/store/${product.slug ?? ""}`);
}

/**
 * One `Offer` per variant, so a sold-out size is reported as sold out rather than being
 * averaged away. A product with no variant data yields a single offer built from the
 * product-level price.
 */
function buildOffers(product: ShopifyProduct) {
  const url = productUrl(product);

  const base = {
    "@type": "Offer" as const,
    url,
    priceCurrency: CURRENCY,
    itemCondition: "https://schema.org/NewCondition",
  };

  if (!product.variants?.length) {
    return [
      {
        ...base,
        price: product.price,
        availability: isSoldOut(product) ? OUT_OF_STOCK : IN_STOCK,
      },
    ];
  }

  return product.variants.map((variant) => ({
    ...base,
    sku: variant.id,
    name: variant.label,
    price: variant.price,
    availability: variant.availableForSale ? IN_STOCK : OUT_OF_STOCK,
  }));
}

export function productJsonLd(product: ShopifyProduct) {
  const images = (product.gallery?.length ? product.gallery : [product.image]).map(
    absoluteUrl
  );

  const rating =
    ratingsAreReal() && product.rating != null && product.reviews != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviews,
          },
        }
      : {};

  const realCategory = meaningfulCategory(product);
  const category = realCategory ? { category: realCategory } : {};

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: productUrl(product),
    image: images,
    ...(product.description ? { description: product.description } : {}),
    // Shopify's `vendor` is not fetched and is inconsistent in the live store — two of
    // three products report "My Store". The brand is not in doubt, so state it.
    brand: { "@type": "Brand", name: BRAND_NAME },
    ...(defaultVariant(product)?.id ? { sku: defaultVariant(product)!.id } : {}),
    ...category,
    offers: buildOffers(product),
    ...rating,
  };
}

export function breadcrumbJsonLd(product: ShopifyProduct) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Store", item: absoluteUrl("/store") },
      { "@type": "ListItem", position: 3, name: product.name, item: productUrl(product) },
    ],
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    url: siteUrl(),
    logo: absoluteUrl("/images/logo.jpeg"),
    description:
      "Premium feminine wellness supplements crafted for the modern woman. Performance meets femininity.",
    // No `sameAs`: the site links to no social profiles, and inventing profile URLs would
    // be worse than omitting the property.
  };
}
