// Payfast custom integration — signing, verification and configuration.
//
// SERVER ONLY. This module reads the merchant key, the passphrase and the
// integrity secret; importing it from a "use client" component would ship all
// three to the browser. Nothing here is safe in a client bundle, and nothing
// here needs to be — the browser only ever receives an already-signed payload.
//
// Flow (Payfast calls this "custom integration"):
//   1. POST /api/payfast/initiate  -> we price the cart from Shopify, sign it,
//      and hand back the exact form fields to submit.
//   2. The browser POSTs that form to Payfast's process URL. The shopper pays
//      on Payfast, never on our origin, so we hold no card data and stay out
//      of PCI scope.
//   3. Payfast POSTs an ITN (Instant Transaction Notification) to
//      /api/payfast/notify, server-to-server. This is the ONLY trustworthy
//      signal that money moved — the shopper's return to `return_url` is not.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sandbox vs live. Defaults to SANDBOX: an unset or misspelled value must never
 * silently start taking real money. Only the exact string "true" goes live,
 * mirroring the NEXT_PUBLIC_USE_PLACEHOLDER_PRODUCTS convention (#68).
 */
export function isLive(): boolean {
  return process.env.PAYFAST_LIVE === "true";
}

/** Where the shopper's browser POSTs the signed form. */
export function processUrl(): string {
  return isLive()
    ? "https://www.payfast.co.za/eng/process"
    : "https://sandbox.payfast.co.za/eng/process";
}

/** Server-confirmation endpoint — we hand an ITN back and expect "VALID". */
export function validateUrl(): string {
  return isLive()
    ? "https://www.payfast.co.za/eng/query/validate"
    : "https://sandbox.payfast.co.za/eng/query/validate";
}

/**
 * Hosts an ITN may legitimately originate from. Checked by resolving each to
 * its current A records rather than hardcoding IPs — Payfast rotates them, and
 * a stale literal list fails closed on every real notification.
 */
export const PAYFAST_HOSTS = [
  "www.payfast.co.za",
  "sandbox.payfast.co.za",
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
] as const;

export interface PayfastConfig {
  merchantId: string;
  merchantKey: string;
  /** Optional on Payfast, but required here — see `getConfig`. */
  passphrase: string;
  /** Absolute origin, e.g. https://heybeautiful.co.za. No trailing slash. */
  siteUrl: string;
  /** Secret backing the cart-integrity HMAC. Never leaves the server. */
  integritySecret: string;
}

/**
 * Reads and validates configuration, or returns null when the gateway isn't
 * set up. Callers must treat null as "payments unavailable" and fail closed
 * rather than falling back to anything.
 *
 * The passphrase is mandatory here even though Payfast treats it as optional.
 * Without one, the signature is an unkeyed MD5 over public form fields, which
 * anyone can forge — it proves nothing about who built the payload. Set one
 * under Payfast → Settings → Security passphrase.
 */
export function getConfig(): PayfastConfig | null {
  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
  const passphrase = process.env.PAYFAST_PASSPHRASE;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const integritySecret = process.env.PAYFAST_INTEGRITY_SECRET;

  if (!merchantId || !merchantKey || !passphrase || !siteUrl || !integritySecret) {
    return null;
  }

  return {
    merchantId,
    merchantKey,
    passphrase,
    siteUrl: siteUrl.replace(/\/+$/, ""),
    integritySecret,
  };
}

/**
 * The order Payfast documents its form fields in, which is also the order the
 * signature string must use. NOT alphabetical — a common and expensive
 * misreading, since an alphabetical string produces a well-formed MD5 that
 * Payfast rejects as "Generated signature does not match submitted signature".
 *
 * Fields absent or empty are skipped entirely (not sent as `key=`), so this
 * array is a superset: it covers what we send today plus the fields most likely
 * to be added next, and unused entries cost nothing.
 */
const FIELD_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "name_first",
  "name_last",
  "email_address",
  "cell_number",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "email_confirmation",
  "confirmation_address",
  "payment_method",
] as const;

/**
 * PHP's `urlencode`, which is what Payfast hashes against — NOT
 * `encodeURIComponent`.
 *
 * Three divergences, each of which alone breaks every signature:
 *   - space is `+`, not `%20`
 *   - `!'()*~` are escaped (encodeURIComponent leaves them literal)
 *   - hex digits are uppercase
 * `encodeURIComponent` already uppercases its own hex, so only the characters
 * we add by hand need care.
 */
function phpUrlEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .replace(/~/g, "%7E")
    .replace(/%20/g, "+");
}

/** `key=value&key=value…&passphrase=…`, the exact string Payfast MD5s. */
function signatureBase(
  pairs: Array<[string, string]>,
  passphrase: string
): string {
  const body = pairs
    // Payfast omits empty fields from the signature. Sending `key=` while
    // hashing without it (or vice versa) is a guaranteed mismatch.
    .filter(([, value]) => value !== "")
    .map(([key, value]) => `${key}=${phpUrlEncode(value.trim())}`)
    .join("&");

  return `${body}&passphrase=${phpUrlEncode(passphrase.trim())}`;
}

/**
 * Signs an outgoing payment payload. Field order comes from FIELD_ORDER, not
 * from the caller's object key order — object literals are easy to reorder
 * during a refactor, and that would silently break every payment.
 */
export function signPayload(
  fields: Record<string, string>,
  passphrase: string
): string {
  const ordered = FIELD_ORDER.filter((key) => key in fields).map(
    (key) => [key, fields[key]] as [string, string]
  );

  // A field we forgot to place in FIELD_ORDER would be sent but not signed —
  // Payfast would reject it, and the cause would be invisible. Fail loudly at
  // the source instead.
  const unknown = Object.keys(fields).filter(
    (key) => !(FIELD_ORDER as readonly string[]).includes(key)
  );
  if (unknown.length > 0) {
    throw new Error(
      `payfast: unsigned field(s) ${unknown.join(", ")} — add them to FIELD_ORDER in their documented position`
    );
  }

  return createHash("md5").update(signatureBase(ordered, passphrase)).digest("hex");
}

/**
 * Parses an ITN body into ordered pairs.
 *
 * Order is load-bearing: an ITN's signature covers its fields **as received**,
 * so the raw body must be walked in sequence. `new URLSearchParams(body)` would
 * work today but invites a later `Object.fromEntries` that quietly drops
 * duplicates and order — parsing by hand keeps the requirement visible.
 */
export function parseItn(rawBody: string): Array<[string, string]> {
  return rawBody
    .split("&")
    .filter(Boolean)
    .map((part) => {
      const index = part.indexOf("=");
      const rawKey = index === -1 ? part : part.slice(0, index);
      const rawValue = index === -1 ? "" : part.slice(index + 1);
      // `+` means space in an application/x-www-form-urlencoded body, and
      // decodeURIComponent does not handle it.
      const decode = (s: string) => decodeURIComponent(s.replace(/\+/g, " "));
      return [decode(rawKey), decode(rawValue)] as [string, string];
    });
}

/**
 * Verifies an ITN's `signature` against its own fields.
 *
 * Everything up to `signature` is hashed, in received order; `signature` itself
 * and anything after it is excluded. Compared in constant time — the digest is
 * derived from a secret passphrase, so a byte-wise early-exit compare is a
 * usable oracle.
 */
export function verifyItnSignature(
  pairs: Array<[string, string]>,
  passphrase: string
): boolean {
  const index = pairs.findIndex(([key]) => key === "signature");
  if (index === -1) return false;

  const received = pairs[index][1];
  const expected = createHash("md5")
    .update(signatureBase(pairs.slice(0, index), passphrase))
    .digest("hex");

  if (received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

/**
 * Cart-integrity token.
 *
 * The shopper's cart lives in localStorage, so the amount reaching Payfast has
 * passed through a surface the shopper fully controls. We price the cart from
 * Shopify server-side, then bind that amount to the order reference with an
 * HMAC and send it as `custom_str1`. Payfast echoes custom fields back on the
 * ITN, so the notification carries proof of what we actually authorised — and
 * `amount_gross` can be checked against it without a database.
 *
 * This detects a tampered amount. It does NOT record the sale, which is a
 * separate concern (see the note in /api/payfast/notify).
 */
export function cartToken(
  reference: string,
  amount: string,
  secret: string
): string {
  return createHmac("sha256", secret).update(`${reference}:${amount}`).digest("hex");
}

/** Constant-time check of an ITN's echoed token against a recomputed one. */
export function verifyCartToken(
  reference: string,
  amount: string,
  token: string,
  secret: string
): boolean {
  const expected = cartToken(reference, amount, secret);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/**
 * Payfast wants a plain decimal with exactly two places and no separators —
 * "1234.56". `formatPrice` renders "R 1 234,56" for humans and is wrong here;
 * this is the wire format, deliberately kept apart from it.
 */
export function toAmount(value: number): string {
  return value.toFixed(2);
}
