"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { fadeUp, staggerContainer } from "@/lib/motion";

/**
 * Privacy policy (#16).
 *
 * ⚠️ DRAFT. Written to describe what this codebase actually does — every processor and
 * storage key named below is real and can be checked against the source — but it has NOT
 * been reviewed by anyone qualified to write binding legal copy. The visible notice at the
 * top says so, and should be removed only once that review has happened.
 *
 * If the data flows change, this page changes with them. The ones it describes today:
 *   - Firebase Auth       src/context/AuthContext.tsx
 *   - localStorage keys   src/lib/constants.ts  (cart, wishlist)
 *   - session hint cookie src/lib/constants.ts  (SESSION_HINT_COOKIE)
 *   - analytics + consent src/lib/analytics.ts
 *   - checkout handoff    src/app/api/checkout/route.ts
 */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section variants={fadeUp} className="mt-12 first:mt-0">
      <h2 className="heading-serif text-ink mb-4 text-2xl">{title}</h2>
      <div className="text-ink/70 space-y-4 text-sm leading-relaxed sm:text-base">
        {children}
      </div>
    </motion.section>
  );
}

export default function PrivacyContent() {
  return (
    <div className="section-py section-padding">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-3xl"
      >
        <motion.div variants={fadeUp}>
          <p className="label-caps text-rose-dark">Legal</p>
          <h1 className="heading-display text-ink mt-3 text-4xl sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="text-ink/50 mt-4 text-sm">Last updated 26 August 2026</p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="glass-card border-rose-gold/30 mt-8 rounded-2xl border p-5"
        >
          <p className="text-ink/75 text-sm leading-relaxed">
            <strong className="text-ink">Draft — pending review.</strong> This policy
            accurately describes how the site currently works, but it has not yet been
            reviewed by a legal professional. Please treat it as a working document rather
            than a final statement of your rights, and{" "}
            <Link
              href="/account"
              className="text-rose-dark underline underline-offset-4 hover:text-rose-gold"
            >
              contact us
            </Link>{" "}
            if anything here matters to a decision you are about to make.
          </p>
        </motion.div>

        <Section title="Who we are">
          <p>
            Hey Beautiful is a South African online store selling wellness supplements. This
            policy covers this website. It does not cover other companies&apos; websites we
            link to.
          </p>
        </Section>

        <Section title="What we collect">
          <p>
            <strong className="text-ink">If you create an account:</strong> your email
            address, and your name if you provide one. If you sign in with Google or Apple,
            we receive your email address and basic profile details from them. Accounts are
            handled by Firebase Authentication, a Google service — we never see or store
            your password.
          </p>
          <p>
            <strong className="text-ink">If you shop:</strong> your bag and wishlist are
            saved in your own browser&apos;s storage, on your device. They are not sent to
            us until you begin checkout.
          </p>
          <p>
            <strong className="text-ink">If you consent to analytics:</strong> pages you
            visit, products you view, and actions such as adding to your bag. This is
            collected by Google Analytics. Without your consent no analytics cookies are
            set.
          </p>
          <p>
            <strong className="text-ink">Automatically:</strong> your IP address is passed
            to Shopify when your bag is turned into a checkout, so their systems can apply
            rate limits fairly per shopper.
          </p>
        </Section>

        <Section title="Payments and orders">
          <p>
            Checkout is handled entirely by <strong className="text-ink">Shopify</strong>.
            When you proceed to payment you leave this site and continue on Shopify&apos;s
            own secure checkout, where you enter your delivery and payment details. Card
            processing is performed by our payment provider.
          </p>
          <p>
            <strong className="text-ink">
              We never see, handle or store your card details.
            </strong>{" "}
            Your order record, delivery address and payment information are held by Shopify
            and the payment provider under their own privacy policies. If you were signed in,
            your email address is passed to Shopify to save you retyping it.
          </p>
        </Section>

        <Section title="Cookies and browser storage">
          <p>We use as little as we can, and we tell you what each one is for.</p>
          <ul className="mt-2 space-y-2 pl-5">
            <li className="list-disc">
              <strong className="text-ink">Essential.</strong> A small marker that records
              you are signed in, so pages know whether to show your account. Your bag and
              wishlist are stored the same way. These are required for the site to work and
              cannot be turned off.
            </li>
            <li className="list-disc">
              <strong className="text-ink">Analytics.</strong> Set by Google Analytics{" "}
              <strong className="text-ink">only after you accept</strong>. Decline, and no
              analytics cookies are stored — we receive only an anonymous, cookie-free signal
              that a page was viewed.
            </li>
          </ul>
          <p>
            You can change your mind at any time by clearing this site&apos;s data in your
            browser settings, which will make the consent banner appear again.
          </p>
        </Section>

        <Section title="Who we share it with">
          <p>
            We do not sell your personal information. We share it only with the services
            that make the store work:
          </p>
          <ul className="mt-2 space-y-2 pl-5">
            <li className="list-disc">
              <strong className="text-ink">Google (Firebase)</strong> — accounts and sign-in
            </li>
            <li className="list-disc">
              <strong className="text-ink">Google Analytics</strong> — usage analytics, only
              with your consent
            </li>
            <li className="list-disc">
              <strong className="text-ink">Shopify</strong> — checkout, orders and delivery
            </li>
            <li className="list-disc">
              <strong className="text-ink">Our payment provider</strong> — card and EFT
              payments
            </li>
          </ul>
          <p>
            Some of these process data outside South Africa. They are established providers
            with their own data-protection commitments.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Under the Protection of Personal Information Act (POPIA) you may ask us to show
            you what personal information we hold about you, correct it if it is wrong,
            delete it, or stop using it for a particular purpose. You may also object to
            processing and complain to the Information Regulator of South Africa.
          </p>
          <p>
            You can delete your account at any time from your{" "}
            <Link
              href="/account"
              className="text-rose-dark underline underline-offset-4 hover:text-rose-gold"
            >
              account page
            </Link>
            . Order records held by Shopify may be retained where the law requires it, for
            example for tax purposes.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we change how we handle your information, we will update this page and the
            date at the top.
          </p>
        </Section>
      </motion.div>
    </div>
  );
}
