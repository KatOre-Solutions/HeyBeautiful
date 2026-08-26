import type { MetadataRoute } from "next";

import { isIndexableDeploy, siteUrl } from "@/lib/site";

/**
 * Paths that should never appear in search results.
 *
 * This list is deliberately NOT imported from `src/proxy.ts`, even though it overlaps its
 * PROTECTED / AUTH_PAGES arrays. They answer different questions: the proxy is the access
 * boundary and is enforced, whereas robots.txt is a request to well-behaved crawlers and
 * enforces nothing. Sharing one list would imply this file protects something. Drift
 * between them is cosmetic — `src/proxy.ts` remains the source of truth for routing.
 *
 * `/verify-email` is here but is intentionally absent from the proxy's AUTH_PAGES, since a
 * signed-in-but-unverified user has to be able to reach it.
 */
const PRIVATE_PATHS = [
  "/account",
  "/checkout",
  "/login",
  "/signup",
  "/forgot-password",
  "/verify-email",
  "/api/",
];

export default function robots(): MetadataRoute.Robots {
  // Deploy previews serve the entire site on a public URL. Left indexable they would
  // compete with production as duplicate content, so they are closed off wholesale — and
  // without a `sitemap` line, which would otherwise invite crawling of what was just
  // disallowed.
  if (!isIndexableDeploy()) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
