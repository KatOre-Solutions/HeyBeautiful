import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Shopify signs every webhook with a base64 HMAC-SHA256 of the RAW request body,
// in `X-Shopify-Hmac-Sha256`. Verify that instead of a shared secret in the query
// string: query strings land in access logs, proxies and Referer headers, and a
// plain `!==` on the secret is a timing oracle.
//
// Scope note: an HMAC proves authenticity and integrity, not freshness — a
// captured valid request can still be replayed. That's accepted here, because the
// only effect of a replay is a redundant cache invalidation.
//
// `timingSafeEqual` is node:crypto-only, so this handler must not run on edge.
// (Route handlers already default to nodejs; stated to document the dependency.)
export const runtime = "nodejs";

/**
 * Constant-time compare of Shopify's signature against ours.
 *
 * Two gotchas. The header is base64 (44 chars for SHA-256), NOT hex — comparing
 * against a hex digest mismatches 100% of the time. And `timingSafeEqual` THROWS
 * on a length mismatch, so lengths must be checked first; that leaks nothing,
 * because `Buffer.from(x, "base64")` never throws (it silently drops invalid
 * characters), so a wrong length only ever means a malformed or wrong-algorithm
 * signature — already a failed verification.
 */
function isSignatureValid(
  rawBody: string,
  header: string | null,
  secret: string
): boolean {
  if (!header) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  const received = Buffer.from(header, "base64");
  if (received.length !== expected.length) return false;
  return timingSafeEqual(received, expected);
}

export async function POST(req: NextRequest) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

  // Fail closed. An unset secret must never degrade to "accept everything". 503
  // rather than 401 so a misconfigured deploy is distinguishable from a forged
  // request in Shopify's delivery log — and Shopify keeps retrying meanwhile.
  if (!secret) {
    console.error("SHOPIFY_WEBHOOK_SECRET is not set — rejecting webhook");
    return NextResponse.json({ message: "Webhook not configured" }, { status: 503 });
  }

  // Must be the raw text. Never call req.json() first: the body is a one-shot
  // stream, and re-serialising it would change the exact bytes Shopify signed.
  const rawBody = await req.text();

  if (!isSignatureValid(rawBody, req.headers.get("x-shopify-hmac-sha256"), secret)) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  // `{ expire: 0 }` expires the tag NOW. The named "max" profile resolves to
  // expire: 31_536_000 — it schedules expiry a YEAR out and only marks the tag
  // stale, so the first shopper after a price change would still be served the
  // old price. See src/lib/shopify.ts, which tags its fetches "products".
  revalidateTag("products", { expire: 0 });

  return NextResponse.json({ revalidated: true });
}
