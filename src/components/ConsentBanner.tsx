"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { ease } from "@/lib/motion";
import {
  getConsentServerSnapshot,
  getConsentSnapshot,
  isAnalyticsConfigured,
  storeConsent,
  subscribeConsent,
  updateConsent,
  type ConsentChoice,
} from "@/lib/analytics";

/**
 * Asks once, remembers the answer (#16).
 *
 * Only rendered when analytics is actually configured — with no measurement ID there is
 * nothing to consent to, and asking anyway would be theatre.
 *
 * The stored answer is read through `useSyncExternalStore` rather than an effect that sets
 * state. `localStorage` is exactly the "external store" that hook exists for, and its
 * server snapshot ("unknown") lets the server render nothing instead of guessing — so a
 * visitor who already answered never sees the banner flash before it disappears.
 *
 * NO `AnimatePresence`, deliberately, even though `SideDrawer` uses it for the same shape
 * of thing. An exit animation here ran to completion and then never unmounted the node,
 * leaving an invisible `position: fixed` strip across the bottom of every page that
 * intercepted clicks — confirmed with `elementFromPoint`, and reproducible in a production
 * build with and without a `key`. A banner that vanishes instantly costs far less than one
 * that silently breaks the footer, so this animates in and then simply stops rendering.
 */
export default function ConsentBanner() {
  const consent = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot
  );

  // Dismissal is ordinary React state so the component unmounts on the normal render path.
  // The store still supplies the INITIAL answer, which is what keeps hydration honest.
  const [dismissed, setDismissed] = useState(false);

  const answer = (choice: ConsentChoice) => {
    storeConsent(choice);
    updateConsent(choice);
    setDismissed(true);
  };

  if (!isAnalyticsConfigured() || consent !== "pending" || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: ease.cinematic }}
      className="fixed inset-x-0 bottom-0 z-50 section-padding pb-6 pt-4"
      role="dialog"
      aria-live="polite"
      aria-label="Analytics cookies"
    >
      <div className="glass-card mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-ink/75 text-sm leading-relaxed">
          We use analytics cookies to understand how the store is used, so we can make it
          better. Nothing is stored until you say yes.{" "}
          <Link
            href="/privacy"
            className="text-rose-dark underline underline-offset-4 transition-colors duration-300 hover:text-rose-gold"
          >
            Read our privacy policy
          </Link>
          .
        </p>

        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => answer("denied")}
            className="btn-luxury btn-outline px-5 py-2.5 text-xs"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => answer("granted")}
            className="btn-luxury btn-primary px-5 py-2.5 text-xs"
          >
            Accept
          </button>
        </div>
      </div>
    </motion.div>
  );
}
