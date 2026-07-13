# Hey Beautiful — project guide

Premium feminine-wellness ecommerce site. **Next.js 16** (App Router, Turbopack) + **TypeScript**
+ **Tailwind CSS** + **Framer Motion**. Auth is **Firebase** (Email/Password + Google + Apple)
via `src/context/AuthContext.tsx`; cart and wishlist are React contexts
(`src/context/CartContext.tsx`, `WishlistContext.tsx`). This is a **custom storefront for
Shopify** — Shopify isn't wired up yet, so product/bundle data currently lives in
`src/lib/products.ts` as placeholders (swap that one module for the Shopify Storefront API later).

## Branching strategy

```
feature branch → PR → main   (integration + testing)
                              ↓
                   main → PR → master   (production-ready only)
                                         ↓
                                    Netlify auto-deploys
```

- **`master`** — production. Protected: no direct commits, PRs only, 1 approval required.
  Netlify deploys exclusively from this branch.
- **`main`** — integration. All feature/fix PRs merge here first. Test and verify on `main`
  before promoting to `master`. Protected: PRs only, no direct commits.
- **Feature branches** — branch off `main`, open PRs back to `main`.

### Branch naming

Feature branches use:

```
<username>/feat/<issue-number>/<kebab-issue-title>
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
- **Email verification** (#22): `/checkout` requires `emailVerified` — enforced client-side in
  `CheckoutContent` (the edge `proxy.ts` can't read Firebase's `emailVerified`), redirecting
  unverified users to `/verify-email?from=<dest>`. `/account` is advisory (soft reminder only).
  `AuthContext.reloadUser()` refreshes `emailVerified`; the verify page polls it to auto-continue.
- **Page pattern**: a top-level route is a server `page.tsx` (`<Navbar /> … <Footer />` +
  `metadata`) that renders a `"use client"` `*Content.tsx` for interactivity (see
  `app/account`, `app/checkout`). Route protection lives in `src/proxy.ts` (Next 16 renamed the
  middleware convention to `proxy.ts`).

## Code review

Both contributors run code reviews with Claude Code CLI (included in a Claude paid subscription).

**Setup (one-time)**
```
npm install -g @anthropic-ai/claude-code   # if not already installed
```

**Running a review**

From inside the `website/` directory:

```bash
# Review the current branch diff vs master
/code-review

# Deep multi-agent review (more thorough, takes longer)
/code-review ultra

# Review a specific GitHub PR by number
/code-review ultra <PR-number>
```

The reviewer posts its findings directly in the terminal. For PR reviews, pass `--comment` to
post findings as inline GitHub PR comments instead:

```bash
/code-review ultra <PR-number> --comment
```

## Commit / PR

- Branch off `main`; never commit straight to `main` or `master`.
- PRs target `main`. Only `main → master` PRs go to production.
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
