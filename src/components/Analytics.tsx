"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

import {
  GA_MEASUREMENT_ID,
  isAnalyticsConfigured,
  readStoredConsent,
  trackPageView,
} from "@/lib/analytics";

/**
 * Loads GA4 under Consent Mode v2 (#16).
 *
 * WHY THE BOOTSTRAP IS JAVASCRIPT AND NOT AN INLINE <script>:
 * Google's snippet is normally an inline script, and an inline script — unlike the JSON-LD
 * data blocks — really is subject to `script-src`, so under `proxy.ts`'s policy it would
 * need the per-request nonce. Reading that nonce means calling `headers()` in the layout,
 * which would make EVERY page dynamic and cost the prerendered product routes their SSG.
 * Pushing to `dataLayer` from this client component instead is same-origin code, allowed
 * by `'self'` with no nonce and no dynamic rendering.
 *
 * ORDERING IS SAFE EITHER WAY. `dataLayer` is a queue and gtag.js does nothing until it
 * sees a `config` command, so whether the script or this effect wins the race, the consent
 * default is processed before the config that follows it in the same queue.
 */
export default function Analytics() {
  const pathname = usePathname();
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (!isAnalyticsConfigured() || bootstrapped.current) return;
    bootstrapped.current = true;

    window.dataLayer = window.dataLayer ?? [];

    // Denied BEFORE anything else. Under Consent Mode v2 this still yields cookieless
    // pings, so traffic shape survives a visitor who never answers the banner.
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

    // A returning visitor who already accepted shouldn't spend a page view in the denied
    // state, so their stored answer is replayed before the first config.
    const stored = readStoredConsent();
    if (stored === "granted") {
      window.dataLayer.push([
        "consent",
        "update",
        { analytics_storage: "granted" },
      ]);
    }

    window.dataLayer.push(["js", new Date()]);
    // `send_page_view: false` because this is a single-page app: gtag would only ever see
    // the first load, so page views are sent explicitly below and would otherwise double
    // count the landing page.
    window.dataLayer.push([
      "config",
      GA_MEASUREMENT_ID,
      { send_page_view: false },
    ]);
  }, []);

  // Fires for the landing page and every client-side navigation after it.
  useEffect(() => {
    if (!isAnalyticsConfigured() || !pathname) return;
    trackPageView(pathname);
  }, [pathname]);

  if (!isAnalyticsConfigured()) return null;

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      strategy="afterInteractive"
    />
  );
}
