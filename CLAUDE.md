# Hey Beautiful — project guide

Premium feminine-wellness ecommerce site. **Next.js 16** (App Router, Turbopack) + **TypeScript**
+ **Tailwind CSS** + **Framer Motion**. Auth is **Firebase** (Email/Password + Google + Apple)
via `src/context/AuthContext.tsx`; cart and wishlist are React contexts
(`src/context/CartContext.tsx`, `WishlistContext.tsx`). This is a **custom storefront for
Shopify**: products come from the Storefront API via `src/lib/shopify.ts` (home featured grid,
store grid, product detail). Bundles have no Shopify equivalent yet and remain placeholders in
`src/lib/products.ts`.

## Brand & design system

**Positioning** — premium feminine-wellness, "performance meets femininity." Editorial, cinematic,
glassy, warm. Think luxury beauty house, not clinical supplement brand.

- **Name / tagline**: "Hey Beautiful — Fuel Your Strength. Keep Your Glow." (site `<title>` and OG).
- **Voice**: aspirational, warm, confident, unfussy. Sentence-case UI copy; reserve ALL-CAPS for
  small `label-caps` eyebrows/labels and button text (via the `.btn-*` utilities), never body copy.
- **Feel**: soft warmth, generous whitespace, slow reveals, glassmorphism, subtle noise/shimmer.
  Avoid hard shadows, pure `#000`/`#fff` fills, and sharp corners — default to warm tones and
  rounded radii (`--radius: 1rem`; cards use `rounded-2xl`).

### Typography

Two Google fonts loaded in `src/app/layout.tsx` and exposed as CSS variables + Tailwind families.
Never import other font families or hardcode `font-family` — use these.

| Role | Font | CSS var | Tailwind | Notes |
| --- | --- | --- | --- | --- |
| Display / headings | Cormorant Garamond (serif, 300–700, incl. italic) | `--font-cormorant` / `--font-display` | `font-display` | Light weights; tight tracking. Use `.heading-display` (300) or `.heading-serif` (400). |
| Body / UI | Manrope (sans, 300–800) | `--font-manrope` / `--font-body` | `font-body` | Default body font (set on `<body>`). |

- Small uppercase labels/eyebrows: use `.label-caps` (Manrope 500, 0.6875rem, 0.18em tracking).
- Prefer the shared heading utilities over ad-hoc `font-*` + tracking combos.

### Color palette

Defined in `tailwind.config.ts`. **Prefer named tokens over hex literals in JSX.** The core brand
tokens are also mirrored as semantic CSS variables in `globals.css` (`:root`).

**Primary brand accent** — `rose-gold` `#c9977a` (Tailwind `rose-gold`, CSS `--primary`/`--ring`).
Its variants: `rose-light` `#f5ddd5`, `rose-dark` `#8b5e52`.

**Neutrals / surfaces**
- `ink` `#1e1814` — primary text/headings (site-wide), also `--foreground`.
- `cream` `#faf7f4` — page background (`--background`, set on `<body>`).
- `parchment` `#f0ebe3` — secondary surface / scrollbar track.

**Extended scales** (50–900 each): `blush` (warm terracotta, base `#cc6b52`),
`sand` (warm neutral, base `#a8845d`), `royal` (blue accent, base `#4361ee` = `--accent`).
Use these for tints/gradients and the secondary blue accent.

**Semantic CSS variables** (space-separated RGB in `:root`, for `rgb(var(--x))` usage):
`--background`, `--foreground`, `--card`, `--popover`, `--primary` `201 151 122`,
`--secondary`, `--muted`, `--muted-foreground` `120 100 88`, `--accent` `67 97 238`,
`--border`/`--input` `232 220 208`, `--ring`. `--radius: 1rem`.

Selection color and custom scrollbar are styled to `rose-gold`/`parchment` in `globals.css` base.

### Depth, glass & texture

- **Shadows** (`boxShadow`): `soft`, `glass` / `glass-hover`, `luxury` / `luxury-hover`, `glow`
  (rose-gold halo). Prefer these over inline `shadow-[…]`.
- **Backdrop blur**: `backdrop-blur-xs|glass|heavy` (2 / 12 / 24px). Glass surfaces use the
  component classes `.glass`, `.glass-warm`, `.glass-dark`, `.glass-card` (rounded, hover-lit).
- **Gradients** (`backgroundImage`): `glass-gradient`, `warm-glow` (hero/section wash),
  `hero-overlay` (image darkening), `card-shimmer`. Plus `.gradient-text` (rose-gold→dark)
  and `.noise-overlay` for cinematic film grain.

### Buttons & shared utilities

Buttons are composed from `.btn-luxury` (pill, uppercase, tracked): use `.btn-primary`
(rose-gold fill), `.btn-outline` (rose-gold outline), or `.btn-glass`. Other shared classes:
`.section-padding` (responsive horizontal), `.section-py` (responsive vertical), `.deco-line`,
`.product-card`, `.text-balance`, `.shimmer-hover`. See `globals.css` before adding new CSS.

### Motion

Import variants + easing from `src/lib/motion.ts` — never inline bezier arrays. Easing presets:
`ease.luxury` `[0.25,0.46,0.45,0.94]`, `ease.cinematic` `[0.16,1,0.3,1]` (default reveal),
`ease.soft`, `ease.out`. Variants: `fadeUp` (standard entrance), `fadeIn`, `slideInLeft/Right`,
`scaleIn`, `staggerContainer` / `staggerContainerSlow`, `textReveal`, `heroEntrance`, `cardHover`,
`glassHover`, `floatAnimation`, `shimmerLine`. Tailwind mirrors these as `transitionTimingFunction`
(`luxury`/`cinematic`/`soft`), extended `transitionDuration` (400–1200ms), and keyframe animations
(`float`, `float-delayed`, `shimmer`, `fade-up`, `pulse-soft`). Reveals are slow and blur-in —
keep entrances in the 0.8–1.2s range to match the cinematic feel.

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

- **Cart/wishlist item ids are namespaced strings** — `product:<n>` (the numeric half of the
  Shopify product gid). Never bare numbers. **Bundles no longer enter the cart** (#92): with no
  Shopify variant they have no `merchandiseId` and could never be checked out, so `BundleCard`
  links to the catalogue instead of adding to the bag. `bundle:<slug>` is therefore no longer a
  cart key — restoring one depends on modelling bundles as Shopify products (#65).
  **The cart owns the variant suffix; the wishlist does not** (#63): cart lines append the
  Shopify variant id (`product:1#4567`) so two sizes are distinct rows, while a wishlist entry
  is a *product* and stays `product:1` — `isWishlisted(product.id)` is what fills the heart.
  Because the two key differently, a wishlist entry carries the `cartLine` that `toCartItem()`
  built for it at wish time, and `WishlistSidebar` moves *that* to the bag — and **renders it
  too**, since `item.price` is the product's `minVariantPrice` and would otherwise quote a
  different figure from the one the bag receives. Never hand a `WishlistProduct` straight to
  `addItem()`, or one product opens two bag rows. Entries persisted before `cartLine` existed
  are dropped on restore rather than falling back, because a stale entry can't be repaired —
  the variant list isn't stored.
  Build every cart id with `toCartItem()` from `src/lib/product.ts` — it is the only place one
  is constructed. See `CartContext`.
  **A cart line also carries `variantId`** (#92) — the same numeric variant id the `#` suffix
  encodes, exposed as a field so the checkout handoff never splits the key apart. It is
  `string | null` and **required**, so the compiler names every producer; `null` means the line
  has no Shopify variant and cannot be bought, which #31 must reject rather than assume. Store
  the numeric id, not a gid — `gid://shopify/ProductVariant/<id>` is rebuilt at mutation time.
  Cart entries persisted before the field existed are dropped on restore, same reasoning as
  `cartLine` above.
- **Catalog data** (#4): products are fetched in `src/lib/shopify.ts` — `getProducts`,
  `getFeaturedProducts`, `getProductBySlug`; the `defaultVariant` / `isSoldOut` /
  `toCartItem` helpers live alongside the types in `src/lib/product.ts`. Fetches are tagged
  `"products"` with an hourly `revalidate` as a safety net; Shopify's product webhooks bust
  the tag on demand via `POST /api/revalidate`.
  With no credentials the store degrades to non-purchasable "Coming Soon" placeholders;
  a *configured* store that errors renders an empty grid rather than fake products.
  Bundles are still hardcoded in `src/lib/products.ts` — no Shopify equivalent yet, and
  display-only since #92.
- **Webhook auth** (#4): `/api/revalidate` verifies Shopify's `X-Shopify-Hmac-Sha256`
  (base64 HMAC-SHA256 over the raw body) with `timingSafeEqual`. Needs
  `SHOPIFY_WEBHOOK_SECRET` — the value Shopify shows under Settings → Notifications →
  Webhooks, not one you invent. Unset fails closed with 503. Use
  `revalidateTag("products", { expire: 0 })`, **not** the `"max"` profile — `"max"` sets
  expiry a year out and only marks the tag stale, so the next shopper still gets the old price.
- **Development catalogue** (#68): `NEXT_PUBLIC_USE_PLACEHOLDER_PRODUCTS=true` serves
  `src/lib/placeholder-products.ts` instead of Shopify, so the storefront can be built before
  the catalogue is populated. **Only the exact string `true`** enables it — `false`, a typo or
  unset all mean Shopify, and the flag is inlined at *build* time, so flipping it on Netlify
  needs a new build. `getProducts`/`getProductBySlug` both honour it (so home, store and
  `/store/[slug]` agree); the module is loaded via `import()` inside the guarded branch, which
  keeps it out of the production bundle and breaks the import cycle with `shopify.ts`.
  ⚠️ Don't confuse it with `ShopifyProduct.placeholder`, which means a *non-purchasable*
  "Coming Soon" tile for an unconfigured store — development products must never set it.
- **Featured showcase** (#68): marked by the plain Shopify tag `featured` (`FEATURED_TAG`), so
  merchandisers control it from admin with no deploy. `getShowcaseProducts()` takes tagged
  products first, then tops up in catalogue order (`BEST_SELLING` for Shopify) — deterministic,
  never random. Cards render `displayTags()`, which strips the marker; `toProduct` keeps the raw
  tag list whole because the 3-tag cap is a card concern.
- **Prices always go through `formatPrice`** (`src/lib/format.ts`) — never construct an
  `Intl.NumberFormat` in a component. It renders `R 54` for whole amounts and `R 54,99`
  when there are cents; three divergent copies once made one screen show both `R 68` and
  `R 75,00` for the same catalog.
- **`ShopifyProductCard` takes `variant` + `priority` from its grid** (#4): `variant`
  ("store" | "featured") picks the column-width `sizes` hint — the store is 4-col, the
  homepage featured grid 5-col, so one string can't serve both. `priority` defaults off;
  only `StoreContent` sets it (`priority={index < 4}`, its LCP row). `npm run images:check`
  guards all of this with literal string matches.
- **Design tokens, colors, fonts, and motion** — see [Brand & design system](#brand--design-system)
  above. Prefer named tokens/utilities over hex literals and inlined bezier arrays.
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
