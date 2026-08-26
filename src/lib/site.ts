/**
 * The public identity of this deploy: what URL it is reachable at, and whether search
 * engines should be allowed to index it.
 *
 * SERVER ONLY. `CONTEXT`, `URL` and `DEPLOY_PRIME_URL` are Netlify build variables with no
 * `NEXT_PUBLIC_` prefix, so they are not inlined into client bundles — importing this from
 * a `"use client"` component would silently resolve every value to the localhost fallback.
 * That is also why it does not live in `@/lib/constants`, which the cart and auth contexts
 * import into the browser.
 */

/** Netlify's own name for the build that is being run. */
const PREVIEW_CONTEXTS = ["deploy-preview", "branch-deploy", "dev"];

/** Local fallback. Only ever used off-platform, where nothing is being crawled anyway. */
const LOCAL_URL = "http://localhost:3000";

/**
 * The absolute origin this deploy is served from, without a trailing slash.
 *
 * Resolution order matters. On a Netlify *preview* build both `URL` and `DEPLOY_PRIME_URL`
 * are set — `URL` is the production site and `DEPLOY_PRIME_URL` is this particular deploy —
 * so preferring `URL` unconditionally would make every preview advertise production's URLs.
 *
 * Set NEXT_PUBLIC_SITE_URL once a custom domain is attached (#18) to override the lot.
 * Like every NEXT_PUBLIC_ var it is inlined at BUILD time, so changing it on Netlify needs
 * a new build, not just a redeploy.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const netlify =
    process.env.CONTEXT === "production"
      ? process.env.URL
      : process.env.DEPLOY_PRIME_URL ?? process.env.URL;

  const resolved = explicit || netlify || LOCAL_URL;

  return resolved.replace(/\/+$/, "");
}

/**
 * Whether crawlers should be allowed to index this deploy at all.
 *
 * Deploy previews serve the whole site on a public URL, so without this they compete with
 * production as duplicate content.
 *
 * Note this fails OPEN: only a *recognised* preview context blocks indexing. An unset
 * `CONTEXT` — local dev, or a host that isn't Netlify — must not quietly de-index the real
 * site, which is a failure nobody would notice until traffic disappeared.
 */
export function isIndexableDeploy(): boolean {
  const context = process.env.CONTEXT;
  return context === undefined || !PREVIEW_CONTEXTS.includes(context);
}

/**
 * Turns a possibly-relative path into an absolute URL.
 *
 * schema.org rejects relative URLs, and `ShopifyProduct.image` is not consistently one
 * thing: a real product carries a `https://cdn.shopify.com/…` URL, while the fallback and
 * the whole development catalogue use site-relative paths like `/images/item-1.jpeg`. So
 * anything already absolute passes through untouched.
 */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl()}/${pathOrUrl.replace(/^\/+/, "")}`;
}
