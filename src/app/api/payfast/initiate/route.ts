import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/shopify";
import {
  cartToken,
  getConfig,
  processUrl,
  signPayload,
  toAmount,
} from "@/lib/payfast";

// node:crypto + the Shopify fetch — must not run on edge. (Route handlers
// already default to nodejs; stated to document the dependency, as
// /api/revalidate does.)
export const runtime = "nodejs";

/**
 * Prices the shopper's cart and returns a signed Payfast payload.
 *
 * The request body carries ids and quantities ONLY. Prices are looked up from
 * Shopify here and the client's are ignored outright — the cart lives in
 * localStorage (see CartContext), so any price arriving from the browser has
 * passed through a surface the shopper controls. Trusting it would let anyone
 * buy the catalogue for a rand.
 */

interface LineRequest {
  id: string;
  quantity: number;
}

/** Cart keys are `product:<productId>#<variantId>` (see `toCartItem`). */
function splitCartId(id: string): { productId: string; variantId: string | null } {
  const [productId, variantId] = id.split("#");
  return { productId, variantId: variantId ?? null };
}

function isLineRequest(value: unknown): value is LineRequest {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.id === "string" &&
    line.id.length > 0 &&
    typeof line.quantity === "number" &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0 &&
    // A sane per-line ceiling. Payfast caps a transaction's total, and an
    // absurd quantity is far more likely to be probing than a real order.
    line.quantity <= 100
  );
}

export async function POST(req: NextRequest) {
  const config = getConfig();

  // Fail closed, exactly as /api/revalidate does for an unset webhook secret.
  // 503 rather than 400 so a misconfigured deploy is distinguishable from a
  // malformed request in the logs.
  if (!config) {
    console.error(
      "Payfast is not configured — set PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY, " +
        "PAYFAST_PASSPHRASE, PAYFAST_INTEGRITY_SECRET and NEXT_PUBLIC_SITE_URL"
    );
    return NextResponse.json({ error: "Payments are unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const items = (body as { items?: unknown })?.items;
  if (!Array.isArray(items) || items.length === 0 || !items.every(isLineRequest)) {
    return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  }

  // Bundles (`bundle:<slug>`) are still hardcoded in src/lib/products.ts with no
  // Shopify equivalent, so there is no authoritative price to check them
  // against. Rejecting is the only safe answer: the alternative is trusting a
  // number from localStorage. Remove this once bundles exist in Shopify.
  const bundle = items.find((line) => line.id.startsWith("bundle:"));
  if (bundle) {
    return NextResponse.json(
      { error: "Bundles can't be checked out yet — please remove them from your bag." },
      { status: 400 }
    );
  }

  const products = await getProducts();

  let total = 0;
  const names: string[] = [];

  for (const line of items) {
    const { productId, variantId } = splitCartId(line.id);
    const product = products.find((p) => p.id === productId);

    // Unknown id, or a "Coming Soon" tile for an unconfigured store — neither is
    // purchasable. Also covers a product deleted since the cart was saved.
    if (!product || product.placeholder) {
      return NextResponse.json(
        { error: "Something in your bag is no longer available." },
        { status: 409 }
      );
    }

    const variant = variantId
      ? product.variants?.find((v) => v.id === variantId)
      : product.variants?.[0];

    if (!variant || !variant.availableForSale) {
      return NextResponse.json(
        { error: "Something in your bag is out of stock." },
        { status: 409 }
      );
    }

    total += variant.price * line.quantity;
    names.push(product.name);
  }

  // Guard against a zero/negative total reaching Payfast, which would either be
  // rejected there or — worse — succeed as a free order.
  if (!(total > 0)) {
    return NextResponse.json({ error: "Invalid cart total" }, { status: 400 });
  }

  const amount = toAmount(total);
  const reference = randomUUID();

  // `item_name` is capped at 100 characters by Payfast and is shown to the
  // shopper on the payment page, so it summarises rather than itemises.
  const itemName =
    names.length === 1
      ? names[0].slice(0, 100)
      : `Hey Beautiful — ${items.length} items`.slice(0, 100);

  const fields: Record<string, string> = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: `${config.siteUrl}/checkout/success`,
    cancel_url: `${config.siteUrl}/checkout/cancelled`,
    notify_url: `${config.siteUrl}/api/payfast/notify`,
    m_payment_id: reference,
    amount,
    item_name: itemName,
    // Binds the amount to the reference so the ITN can prove what we
    // authorised. See `cartToken`.
    custom_str1: cartToken(reference, amount, config.integritySecret),
  };

  // Buyer details are prefill only, and deliberately not trusted for anything:
  // Payfast collects and confirms the payer's own details on its page.
  const email = (body as { email?: unknown })?.email;
  if (typeof email === "string" && email.includes("@") && email.length <= 100) {
    fields.email_address = email;
  }

  return NextResponse.json({
    url: processUrl(),
    fields: { ...fields, signature: signPayload(fields, config.passphrase) },
  });
}
