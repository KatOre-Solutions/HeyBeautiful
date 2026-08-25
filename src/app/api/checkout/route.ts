// Turns the shopper's bag into a Shopify cart and returns its checkout URL (#31).
// The browser then navigates there and Shopify runs the rest of the purchase.
//
// WHY /api AND NOT A SERVER ACTION OR /checkout/...:
// `proxy.ts` gates every path starting with `/checkout` and its matcher excludes
// `/api`. A handler under `/checkout/...` — and a Server Action, which POSTs to
// the page's own URL — would therefore be answered with a 307 to `/login` the
// moment the session-hint cookie is stale, and `fetch` would follow it and get
// HTML back. Living under `/api` avoids that whole failure mode.
//
// WHY THIS ENDPOINT IS UNAUTHENTICATED:
// It grants no capability a visitor doesn't already have. Shopify's own cart
// permalinks (`/cart/<variantId>:<qty>`) let anyone build a checkout URL with no
// API at all. This reads no user data, takes no payment, and returns only a URL
// Shopify is happy to hand out. Verifying a Firebase ID token would need
// `firebase-admin`, which this repo doesn't carry — that's #57's ground, and
// under hosted checkout there is no order endpoint of ours left to protect.
// What it MUST do instead is validate its input tightly, so it can't be turned
// into a general-purpose proxy for arbitrary Storefront mutations.

import { NextResponse, type NextRequest } from "next/server";

import { createCart, isValidCheckoutUrl, type CheckoutLine } from "@/lib/shopify";
import { MAX_CART_LINES, MAX_CART_QUANTITY } from "@/lib/constants";

// Caps live in `@/lib/constants` so the cart UI enforces the same ceiling — a
// limit only the server knows about is a dead end the shopper can't diagnose.
// They also stop a hand-rolled POST asking Shopify to price ten thousand lines
// on our token.

/** Shopify variant ids are numeric. Anything else never reaches the mutation. */
const NUMERIC_ID = /^\d+$/;

interface RawLine {
  variantId?: unknown;
  quantity?: unknown;
}

/**
 * Returns the parsed lines, or a string naming what was wrong. A string rather
 * than a thrown error keeps the handler's guard-clause shape.
 */
function parseLines(raw: unknown): CheckoutLine[] | string {
  if (!Array.isArray(raw)) return "Expected an array of lines.";
  if (raw.length === 0) return "Your bag is empty.";
  if (raw.length > MAX_CART_LINES)
    return `A bag can hold at most ${MAX_CART_LINES} different items.`;

  const lines: CheckoutLine[] = [];

  for (const entry of raw as RawLine[]) {
    const { variantId, quantity } = entry ?? {};

    // `null` is the #92 marker for a line with no Shopify variant — a bundle, or
    // a placeholder tile. Those can never be bought, so they are rejected here
    // rather than sent to Shopify to fail less clearly.
    if (typeof variantId !== "string" || !NUMERIC_ID.test(variantId)) {
      return "That bag contains an item that can't be purchased.";
    }

    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_CART_QUANTITY
    ) {
      return `Each item is limited to ${MAX_CART_QUANTITY}. Please reduce the quantity.`;
    }

    lines.push({ variantId, quantity });
  }

  return lines;
}

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const { lines: rawLines, email } = (body ?? {}) as {
    lines?: unknown;
    email?: unknown;
  };

  const parsed = parseLines(rawLines);

  if (typeof parsed === "string") {
    return NextResponse.json({ message: parsed }, { status: 400 });
  }

  // Forwarded to Shopify so its per-IP Storefront rate limit is attributed to the
  // shopper rather than to this server — otherwise every cart creation shares one
  // bucket with the catalogue reads. Netlify sets x-nf-client-connection-ip;
  // x-forwarded-for is the general fallback. Spoofable, but it is a metering
  // hint, not an authorisation input.
  const buyerIp =
    req.headers.get("x-nf-client-connection-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined;

  const result = await createCart(
    parsed,
    typeof email === "string" && email !== "" ? email : undefined,
    buyerIp
  );

  if (!result.ok) {
    // 503 for a store that isn't wired up yet, mirroring /api/revalidate's
    // distinction: a misconfigured deploy should be tellable apart from a
    // request Shopify actively refused.
    const status = result.reason === "unconfigured" ? 503 : 502;
    return NextResponse.json(
      { message: "We couldn't start checkout just now. Please try again." },
      { status }
    );
  }

  // Belt and braces: this URL becomes a top-level navigation in the browser, so
  // an unexpected host must never be handed back. `createCart` only ever returns
  // what Shopify sent, but that is exactly the value worth checking.
  if (!isValidCheckoutUrl(result.checkoutUrl)) {
    // Log the HOST only. A checkout URL carries the cart's secret `?key=` — the
    // same value the mutation deliberately avoids selecting — so writing the raw
    // URL here would put a live cart capability into the function logs for every
    // shopper this rejects.
    let host = "unparseable";
    try {
      host = new URL(result.checkoutUrl).host;
    } catch {
      // keep the placeholder
    }
    console.error("Rejected checkout URL from unexpected host:", host);
    return NextResponse.json(
      { message: "We couldn't start checkout just now. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ checkoutUrl: result.checkoutUrl });
}
