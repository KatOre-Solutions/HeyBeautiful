# Hey Beautiful — project guide

Premium feminine-wellness ecommerce site. **Next.js 16** (App Router, Turbopack) + **TypeScript**
+ **Tailwind CSS** + **Framer Motion**. Auth is **Firebase** (Email/Password + Google + Apple)
via `src/context/AuthContext.tsx`; cart and wishlist are React contexts
(`src/context/CartContext.tsx`, `WishlistContext.tsx`). This is a **custom storefront for
Shopify** — Shopify isn't wired up yet, so product/bundle data currently lives in
`src/lib/products.ts` as placeholders (swap that one module for the Shopify Storefront API later).

## Branch naming

Feature branches use:

```
oreutlwile/feat/<issue-number>/<kebab-issue-title>
```

Example: issue #3 "Product Detail Pages" → `oreutlwile/feat/3/product-detail-pages`.
For non-feature work substitute the type segment: `fix`, `chore`, `refactor`, `docs`.

## Conventions

- **Cart/wishlist item ids are namespaced strings** — `product:<n>` (e.g. `product:1`) and
  `bundle:<slug>` (e.g. `bundle:glow`). Never bare numbers. Variant-specific cart lines append
  `#<variantId>` (e.g. `product:1#60ct`). See `src/lib/products.ts` and `CartContext`.
- **Design tokens** (`tailwind.config.ts`): `rose-gold` (#c9977a, primary accent), `ink`
  (#1e1814, primary text), `cream` (#faf7f4), `parchment` (#f0ebe3). Prefer these over hex
  literals in JSX.
- **Motion**: import variants + easing from `src/lib/motion.ts` (`fadeUp`, `staggerContainer`,
  `ease.cinematic`, …) rather than inlining `[0.16, 1, 0.3, 1]`.
- **Shared CSS utilities** (`src/app/globals.css`): `section-py`, `section-padding`,
  `label-caps`, `heading-display`, `heading-serif`, `btn-outline`, `glass-card`, `product-card`.
- **Page pattern**: a top-level route is a server `page.tsx` (`<Navbar /> … <Footer />` +
  `metadata`) that renders a `"use client"` `*Content.tsx` for interactivity (see
  `app/account`, `app/checkout`). Route protection lives in `src/proxy.ts` (Next 16 renamed the
  middleware convention to `proxy.ts`).

## Commit / PR

- Branch off the relevant base; never commit straight to `master`.
- Commit messages reference the issue (`#3`); use `Closes #n` in the PR body to auto-close.

## Build note — Windows path casing

`next build` must be launched from the **correctly-cased** project path
(`C:\Users\Admin\Documents\Dev-wip\Hey Beautiful\website` — capital `Documents`,
`Dev-wip`, `Hey Beautiful`). If the build runs with a `process.cwd()` whose casing
differs from the real on-disk casing (e.g. an all-lowercase `cd`), Node resolves Next's
internal modules under two casings and instantiates its prerender `workAsyncStorage`
twice, producing `InvariantError: Expected workStore to be initialized` on every page
during static generation. `next dev` is unaffected. Run builds via `npm run build` from a
terminal opened in the project folder (which uses the real casing).
