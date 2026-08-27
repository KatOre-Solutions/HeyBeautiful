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

/**
 * AI crawlers, named explicitly so the policy is a decision rather than a side effect of
 * the wildcard.
 *
 * The private paths are REPEATED for this group on purpose, and dropping them would be a
 * real bug: per the robots.txt spec a crawler obeys only the most specific group matching
 * its name and ignores `*` entirely. Naming GPTBot without repeating the disallows would
 * therefore *widen* its access to /account and /checkout rather than leave it unchanged.
 *
 * Allowed because Hey Beautiful is a new brand with nothing proprietary on the site —
 * being citable when someone asks an assistant for wellness supplements is free
 * distribution. Flipping this to `disallow: "/"` is the only edit needed to reverse it.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "meta-externalagent",
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
      {
        userAgent: AI_CRAWLERS,
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
