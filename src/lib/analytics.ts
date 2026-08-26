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

let bootstrapped = false;

/**
 * Queues the consent default, then the config, exactly once.
 *
 * This lives here rather than in a component effect because effect order made it wrong:
 * React runs child effects before parent ones, so the product page's `view_item` fired
 * before `<Analytics>` had pushed anything — putting a measurement command ahead of the
 * consent default, which Google explicitly requires to come first. Driving it from `push`
 * makes the order impossible to get wrong: whatever fires first triggers the bootstrap
 * ahead of itself.
 */
function bootstrap(): void {
  if (bootstrapped) return;
  bootstrapped = true;

  window.dataLayer = window.dataLayer ?? [];

  // Denied before anything else. Under Consent Mode v2 this still yields cookieless pings,
  // so traffic shape survives a visitor who never answers the banner.
  window.dataLayer.push([
    "consent",
    "default",
    {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    },
  ]);

  // A returning visitor who already accepted shouldn't spend a page view denied.
  if (readStoredConsent() === "granted") {
    window.dataLayer.push(["consent", "update", { analytics_storage: "granted" }]);
  }

  window.dataLayer.push(["js", new Date()]);
  // `send_page_view: false` because this is a single-page app: gtag.js only ever sees the
  // first load, so page views are sent explicitly and would otherwise double count the
  // landing page.
  window.dataLayer.push(["config", GA_MEASUREMENT_ID, { send_page_view: false }]);
}

/**
 * Pushes to `dataLayer` directly rather than calling `window.gtag`.
 *
 * The two are equivalent once gtag.js has loaded, but an event fired before it finishes
 * loading would be dropped by a `window.gtag` that isn't defined yet. `dataLayer` is a
 * plain array, so anything queued on it is replayed when the script arrives — which
 * matters for `view_item`, fired on first paint.
 */
function push(...args: GtagArgs): void {
  if (typeof window === "undefined" || !isAnalyticsConfigured()) return;
  bootstrap();
  window.dataLayer!.push(args);
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

/**
 * Maps a cart line or product to GA4's item shape.
 *
 * Structurally typed rather than importing `CartLine`, so this module stays independent of
 * the product model. `item_id` prefers the Shopify variant id because that is the actual
 * SKU — the thing a merchandiser can look up — falling back to the namespaced cart key for
 * lines that have no variant.
 */
export function toAnalyticsItem(
  line: {
    id: string;
    name: string;
    category: string;
    price: number;
    variantId?: string | null;
  },
  quantity?: number
): AnalyticsItem {
  // "Product" is what `toProduct` substitutes for an empty Shopify productType, and
  // shipping it would fill GA4's category dimension with a word that distinguishes nothing.
  // The JSON-LD builder makes the same call; PR #99 extracts both onto a shared
  // `meaningfulCategory()` helper, which this should collapse onto once that lands.
  const category = line.category !== "Product" ? line.category : undefined;

  return {
    item_id: line.variantId ?? line.id,
    item_name: line.name,
    price: line.price,
    ...(category ? { item_category: category } : {}),
    ...(quantity !== undefined ? { quantity } : {}),
  };
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
  // A list impression has no monetary value — summing the prices of a grid produces a
  // number no report should show — so `value` is omitted for it and sent for everything else.
  const monetary = event !== "view_item_list";
  const value = items.reduce(
    (sum, item) => sum + item.price * (item.quantity ?? 1),
    0
  );

  push("event", event, {
    currency: "ZAR",
    ...(monetary ? { value: Number(value.toFixed(2)) } : {}),
    items,
    ...extra,
  });
}
