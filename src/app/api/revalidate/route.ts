import crypto from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// Uses Node's crypto — pin the runtime so this never gets bundled for the edge.
export const runtime = "nodejs";

/**
 * Shopify product webhook → on-demand cache bust for the "products" tag.
 *
 * Authenticated by Shopify's own HMAC signature rather than a URL secret: every
 * webhook is signed with `X-Shopify-Hmac-Sha256` (base64 HMAC-SHA256 of the raw
 * request body, keyed by the webhook signing secret). Verifying that keeps the
 * secret out of the query string (which leaks into access logs and Referer) and
 * proves the body is untampered. `SHOPIFY_REVALIDATE_SECRET` must hold the same
 * signing secret Shopify uses. Unset → fail closed (every request 401s; only the
 * hourly fallback in getFeaturedProducts refreshes).
 */
export async function POST(req: Request) {
  const secret = process.env.SHOPIFY_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ message: "Not configured" }, { status: 401 });
  }

  const signature = req.headers.get("x-shopify-hmac-sha256");
  if (!signature) {
    return NextResponse.json({ message: "Missing signature" }, { status: 401 });
  }

  // Sign the raw bytes exactly as received — parsing first would change them.
  const rawBody = await req.text();
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  // Constant-time compare. timingSafeEqual throws on length mismatch, so guard it.
  const expected = Buffer.from(digest);
  const received = Buffer.from(signature);
  if (
    expected.length !== received.length ||
    !crypto.timingSafeEqual(expected, received)
  ) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  revalidateTag("products", "max");
  return NextResponse.json({ revalidated: true });
}
