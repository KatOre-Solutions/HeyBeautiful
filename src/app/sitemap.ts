import type { MetadataRoute } from "next";

import { getProducts } from "@/lib/shopify";
import { siteUrl } from "@/lib/site";

/**
 * Every publicly indexable route. The auth and account pages are excluded here and
 * disallowed in `robots.ts`.
 *
 * `lastModified` is deliberately absent throughout. `ShopifyProduct` carries no date field —
 * no `updatedAt`, `publishedAt` or `createdAt` — and the obvious substitute, `new Date()`,
 * would claim every page changed every time this regenerates (hourly). Search engines
 * discount a `lastModified` they learn to distrust, so omitting it is worth more than
 * inventing one. Adding a real `updatedAt` to the catalogue fragment would let this carry a
 * truthful value.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/store`, changeFrequency: "daily", priority: 0.9 },
  ];

  // `getProducts` never throws: it returns [] for a configured store that errored, and the
  // "Coming Soon" placeholders when the store isn't configured at all. So a Shopify outage
  // degrades this to the two static routes rather than failing the build.
  const products = await getProducts();

  // Same predicate as `generateStaticParams` in `src/app/store/[slug]/page.tsx`. These two
  // must agree — a sitemap URL with no prerendered page is a 404 handed to a crawler.
  // It also drops the placeholder tiles, which have no handle and no detail page.
  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${base}/store/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  return [...staticRoutes, ...productRoutes];
}
