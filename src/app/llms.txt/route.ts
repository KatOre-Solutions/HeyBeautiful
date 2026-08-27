// /llms.txt — a curated, plain-text map of the store for AI assistants (#14).
//
// Follows the llmstxt.org convention: an H1, a blockquote summary, then H2 sections of
// annotated links. The point is to hand a model the few things worth knowing in one cheap
// fetch, instead of making it crawl and strip HTML to work out what this site sells.
//
// The filename is `llms.txt`, plural — that is the name the convention defines and the one
// crawlers look for. Issue #14 writes it "llm.txt"; that is the same thing by a shorter name.
//
// This is a Route Handler rather than a static file in `public/` because the product list
// has to track the Shopify catalogue. It reuses `getProducts()`, so it inherits the same
// hourly revalidate and `products` cache tag as the storefront — a product webhook
// refreshes this file too.

import { getProducts } from "@/lib/shopify";
import { isSoldOut, meaningfulCategory, type ShopifyProduct } from "@/lib/product";
import { formatPrice } from "@/lib/format";
import { siteUrl } from "@/lib/site";

// Prerendered at build and refreshed by the `products` tag, like sitemap.xml. Nothing here
// reads the request, so there is no reason to render it per visitor.
export const dynamic = "force-static";

/** Shopify descriptions are long free text with newlines; a link annotation wants one line. */
function summarise(text: string | undefined, max = 160): string {
  if (!text) return "";
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}

function productLine(product: ShopifyProduct, base: string): string {
  const price = formatPrice(product.price);
  const stock = isSoldOut(product) ? " Currently sold out." : "";
  const summary = summarise(product.description);
  const detail = [price, meaningfulCategory(product), summary]
    .filter(Boolean)
    .join(" · ");

  return `- [${product.name}](${base}/store/${product.slug}): ${detail}${stock}`;
}

export async function GET() {
  const base = siteUrl();

  // Same predicate as `generateStaticParams` and `sitemap.ts`: no handle, no detail page,
  // so nothing to link to. It also excludes the "Coming Soon" placeholder tiles.
  const products = (await getProducts()).filter((p) => p.slug);

  const body = `# Hey Beautiful

> Premium feminine wellness supplements for women — plant protein, collagen and daily
> essentials. South African brand, prices in South African Rand (ZAR).

Hey Beautiful is a direct-to-consumer wellness store. Browse the catalogue at ${base}/store;
each product has its own page with variants, pricing and availability. Checkout is handled by
Shopify, so orders, payment and delivery are managed there rather than on this site.

## Products

${products.length > 0 ? products.map((p) => productLine(p, base)).join("\n") : "- The catalogue is being updated. See " + base + "/store for the current range."}

## Pages

- [Home](${base}/): brand introduction, featured products and the story behind the range.
- [Store](${base}/store): the full catalogue.

## Notes

- Prices are in ZAR and include the amount shown at checkout before shipping.
- Availability is per variant — a product may have one size in stock and another sold out.
- Account, cart and checkout pages require sign-in and are not useful to index.
- This file is generated from the live catalogue and refreshes when products change.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
