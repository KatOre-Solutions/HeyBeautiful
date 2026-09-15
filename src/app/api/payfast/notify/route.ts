import { promises as dns } from "node:dns";
import { NextRequest, NextResponse } from "next/server";
import {
  PAYFAST_HOSTS,
  getConfig,
  parseItn,
  validateUrl,
  verifyCartToken,
  verifyItnSignature,
} from "@/lib/payfast";

// node:dns + node:crypto — must not run on edge.
export const runtime = "nodejs";
// An ITN is a side-effecting notification; nothing about it is cacheable.
export const dynamic = "force-dynamic";

/**
 * Payfast ITN (Instant Transaction Notification) handler.
 *
 * This is the ONLY trustworthy signal that a payment succeeded. The shopper's
 * redirect back to `return_url` proves nothing — it is a browser navigation the
 * shopper can perform, replay or fabricate without paying, so /checkout/success
 * is presentation only and must never grant anything.
 *
 * Payfast documents four checks, and all four are required. Each one alone is
 * insufficient:
 *   1. signature   — proves the payload was built with our passphrase.
 *   2. source IP   — proves it came from Payfast's infrastructure.
 *   3. server confirmation — proves Payfast agrees this exact ITN is real, which
 *      is what defeats a replay of a captured-and-modified body.
 *   4. amount      — proves the shopper paid what we asked, not what they chose.
 */

/** True when `ip` is an A record of any Payfast host. */
async function isPayfastSource(ip: string | null): Promise<boolean> {
  if (!ip) return false;

  const resolved = await Promise.all(
    PAYFAST_HOSTS.map((host) => dns.resolve4(host).catch(() => [] as string[]))
  );

  return resolved.some((addresses) => addresses.includes(ip));
}

/**
 * The connecting client's IP.
 *
 * Netlify sets `x-nf-client-connection-ip` from the actual TCP peer, so it is
 * the only header here a client cannot forge; `x-forwarded-for` is a fallback
 * for other hosts, and we take its FIRST entry — the leftmost is the original
 * client, later entries are proxies.
 *
 * Both are ultimately host-supplied headers. That is exactly why check 3
 * (server confirmation) exists and is not optional: it does not depend on any
 * header being honest.
 */
function clientIp(req: NextRequest): string | null {
  const direct = req.headers.get("x-nf-client-connection-ip");
  if (direct) return direct.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : null;
}

/** Hands the ITN back to Payfast verbatim and expects "VALID". */
async function confirmWithPayfast(rawBody: string): Promise<boolean> {
  try {
    const response = await fetch(validateUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      // Must be the bytes Payfast sent. Re-serialising a parsed body can
      // reorder fields or re-encode characters, and Payfast would not
      // recognise the result.
      body: rawBody,
      cache: "no-store",
    });

    if (!response.ok) return false;
    return (await response.text()).trim().startsWith("VALID");
  } catch (err) {
    console.error("Payfast validate call failed:", err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const config = getConfig();

  // Every exit below is 200. Payfast retries a non-2xx on a schedule, and a
  // rejected ITN is not something a retry can fix — the identical body would
  // fail identically, so retrying only produces noise. The response body is
  // empty because Payfast ignores it; the outcome is recorded in our logs.
  const ack = () => new NextResponse(null, { status: 200 });

  if (!config) {
    console.error("Payfast is not configured — dropping ITN");
    return ack();
  }

  // One-shot stream: read the raw text before anything else, exactly as the
  // Shopify webhook does. Calling req.formData() first would consume it and
  // change the bytes we need for checks 1 and 3.
  const rawBody = await req.text();
  const pairs = parseItn(rawBody);
  const get = (key: string) => pairs.find(([k]) => k === key)?.[1] ?? "";

  const reference = get("m_payment_id");

  // 1. Signature.
  if (!verifyItnSignature(pairs, config.passphrase)) {
    console.error(`Payfast ITN ${reference}: signature mismatch`);
    return ack();
  }

  // 2. Source.
  const ip = clientIp(req);
  if (!(await isPayfastSource(ip))) {
    console.error(`Payfast ITN ${reference}: untrusted source ip ${ip}`);
    return ack();
  }

  // 3. Server confirmation.
  if (!(await confirmWithPayfast(rawBody))) {
    console.error(`Payfast ITN ${reference}: Payfast did not confirm this notification`);
    return ack();
  }

  // 4. Amount. `amount_gross` is what the shopper actually paid; the token in
  // custom_str1 is what we authorised at initiate time. They must agree.
  const amountGross = get("amount_gross");
  if (
    !reference ||
    !verifyCartToken(reference, amountGross, get("custom_str1"), config.integritySecret)
  ) {
    console.error(
      `Payfast ITN ${reference}: amount ${amountGross} does not match the authorised amount`
    );
    return ack();
  }

  const status = get("payment_status");

  // Payfast sends ITNs for outcomes other than success (e.g. CANCELLED on a
  // reversal). Only COMPLETE means money moved.
  if (status !== "COMPLETE") {
    console.warn(`Payfast ITN ${reference}: status ${status} — no action taken`);
    return ack();
  }

  recordPaidOrder({
    reference,
    amount: amountGross,
    payfastPaymentId: get("pf_payment_id"),
    email: get("email_address"),
    name: [get("name_first"), get("name_last")].filter(Boolean).join(" "),
  });

  return ack();
}

interface PaidOrder {
  reference: string;
  amount: string;
  payfastPaymentId: string;
  email: string;
  name: string;
}

/**
 * ⚠️ INCOMPLETE — this is the fulfilment seam, and it currently only logs.
 *
 * The payment above is fully verified, but this project has no order store:
 * Firebase is auth-only (no Firestore), and only the Shopify STOREFRONT token
 * is configured, which cannot create orders. So a verified payment currently
 * produces a log line and nothing else — no order record, no inventory
 * decrement, no receipt, and no duplicate-ITN guard.
 *
 * Before taking live payments this must persist the order and become
 * idempotent on `reference` (Payfast can and does deliver the same ITN more
 * than once, and at-least-once delivery is the contract). Two workable routes:
 *
 *   - Shopify Admin API `orderCreate` — keeps Shopify the single source of
 *     truth, so inventory, receipts, fulfilment and refunds keep working as
 *     they do for the rest of the catalogue. Needs an Admin API access token.
 *   - Firestore + firebase-admin — fewer moving parts, but Shopify would not
 *     know the sale happened, so stock and fulfilment drift immediately.
 *
 * Logging at least leaves a durable trace in the host's logs so no verified
 * payment is silently lost in the meantime.
 */
function recordPaidOrder(order: PaidOrder): void {
  console.info("Payfast payment verified:", JSON.stringify(order));
}
