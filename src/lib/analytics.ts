// GA4 measurement (#16), behind Consent Mode v2.
//
// Every function here is a no-op when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is unset, so a
// developer without a GA property — and any preview build — runs the real code paths
// without sending anything. Same degrade-quietly shape as the Shopify layer.
//
// WHAT THIS DOES NOT MEASURE: `purchase`. Checkout is handed off to Shopify (#31), so the
// order is created on Shopify's domain and Shopify's own GA4 integration is what reports
// the conversion. Firing a `purchase` here would be inventing one, since this site never
// learns whether payment succeeded. Our funnel ends at `begin_checkout`.

const CONSENT_STORAGE_KEY = "hb-analytics-consent";

/** Inlined at build time, like every NEXT_PUBLIC_ value. Empty means "no analytics". */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export function isAnalyticsConfigured(): boolean {
  return GA_MEASUREMENT_ID !== "";
}

export type ConsentChoice = "granted" | "denied";

/* eslint-disable @typescript-eslint/no-explicit-any */
type GtagArgs = any[];

declare global {
  interface Window {
    dataLayer?: GtagArgs[];
    gtag?: (...args: GtagArgs) => void;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Pushes to `dataLayer` directly rather than calling `window.gtag`.
 *
 * The two are equivalent once gtag.js has loaded, but events fired before it finishes
 * loading would be dropped by a `window.gtag` call that isn't defined yet. `dataLayer` is
 * created synchronously by the consent bootstrap, so anything queued on it is replayed
 * when the script arrives — which matters for `view_item`, fired on first paint.
 */
function push(...args: GtagArgs): void {
  if (typeof window === "undefined" || !isAnalyticsConfigured()) return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(args);
}

/** The visitor's stored choice, or null if they haven't answered yet. */
export function readStoredConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    // Private mode, or storage disabled. Treat as "not answered" rather than throwing —
    // the banner reappearing is a far smaller problem than a crash on first paint.
    return null;
  }
}

export function storeConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Same reasoning as above: the choice is honoured for this page view either way.
  }
  cachedConsent = choice;
  listeners.forEach((notify) => notify());
}

/**
 * `localStorage` as an external store, so the banner can read it with
 * `useSyncExternalStore` instead of setting state from an effect.
 *
 * "unknown" is the SERVER snapshot and exists to keep hydration honest: the server cannot
 * know the answer, so it renders nothing at all rather than guessing and flashing a banner
 * at a visitor who already replied. The client resolves it to "pending" or a real choice on
 * the first commit.
 */
export type ConsentState = ConsentChoice | "pending" | "unknown";

let cachedConsent: ConsentState | null = null;
let listeners: (() => void)[] = [];

export function subscribeConsent(notify: () => void): () => void {
  listeners = [...listeners, notify];
  return () => {
    listeners = listeners.filter((l) => l !== notify);
  };
}

export function getConsentSnapshot(): ConsentState {
  // Cached because useSyncExternalStore requires a stable value between renders — reading
  // localStorage afresh each call is allowed, but re-deriving "pending" would return a new
  // value identity only if it were an object, and caching also keeps the read cheap.
  cachedConsent ??= readStoredConsent() ?? "pending";
  return cachedConsent;
}

export function getConsentServerSnapshot(): ConsentState {
  return "unknown";
}

/**
 * Tells Google the visitor has answered. Under Consent Mode v2 a `denied` state still
 * sends cookieless pings, so traffic shape survives a refusal while nothing identifying
 * is stored.
 */
export function updateConsent(choice: ConsentChoice): void {
  push("consent", "update", {
    analytics_storage: choice,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

/** A GA4 page_view. Called on route changes, since gtag.js only sees the first load. */
export function trackPageView(path: string): void {
  push("event", "page_view", { page_path: path });
}

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  price: number;
  item_category?: string;
  item_variant?: string;
  quantity?: number;
}

type EcommerceEvent =
  | "view_item"
  | "view_item_list"
  | "add_to_cart"
  | "remove_from_cart"
  | "view_cart"
  | "add_to_wishlist"
  | "begin_checkout";

/**
 * GA4 ecommerce events all take the same envelope: a currency, a value, and the items.
 * `currency` is required alongside `value` or GA4 discards the monetary part silently.
 */
export function trackEcommerce(
  event: EcommerceEvent,
  items: AnalyticsItem[],
  extra?: Record<string, unknown>
): void {
  const value = items.reduce(
    (sum, item) => sum + item.price * (item.quantity ?? 1),
    0
  );

  push("event", event, {
    currency: "ZAR",
    value: Number(value.toFixed(2)),
    items,
    ...extra,
  });
}
