"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

import {
  GA_MEASUREMENT_ID,
  isAnalyticsConfigured,
  trackPageView,
} from "@/lib/analytics";

/**
 * Loads gtag.js and reports client-side navigations (#16).
 *
 * The consent bootstrap deliberately does NOT live here. It used to, and effect order made
 * it wrong: React runs child effects before parent ones, so a product page's `view_item`
 * fired before this component had pushed anything, putting a measurement command ahead of
 * the consent default. It now lives in `@/lib/analytics`, triggered by the first event of
 * any kind, which makes the ordering impossible to get wrong.
 *
 * WHY THERE IS NO INLINE <script>: Google's snippet is normally inline, and an inline
 * script — unlike the JSON-LD data blocks from #14 — really is subject to `script-src`, so
 * under `proxy.ts`'s policy it would need the per-request nonce. Reading that nonce means
 * calling `headers()` in the layout, which would make every page dynamic and cost the
 * prerendered product routes their SSG. Same-origin client code needs neither.
 */
export default function Analytics() {
  const pathname = usePathname();

  // Fires for the landing page and every client-side navigation after it. gtag.js is
  // configured with `send_page_view: false`, so this is the only source of page views.
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
