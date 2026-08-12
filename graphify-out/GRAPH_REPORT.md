# Graph Report - website  (2026-08-12)

## Corpus Check
- 78 files · ~205,181 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 501 nodes · 869 edges · 31 communities (26 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2ea4cdef`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- motion.ts
- ShopifyProductCard.tsx
- LoginContent.tsx
- dependencies
- devDependencies
- shopify.ts
- compilerOptions
- Hero.tsx
- AuthContext.tsx
- check-video.mjs
- Development frameworks and SDKs
- normalize-video.mjs
- normalize-images.mjs
- Hey Beautiful — project guide
- check-images.mjs
- 4xx and 5xx status codes
- Token-based authentication
- GraphQL Storefront API
- https://{store\_name}.myshopify.com/api/2026-04/graphql.json
- Sample error codes
- Storefront Directives
- Status and error codes
- Endpoints and queries
- route.ts
- not-found.tsx
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- tailwind.config.ts

## God Nodes (most connected - your core abstractions)
1. `fadeUp` - 20 edges
2. `useAuth()` - 17 edges
3. `useCart()` - 17 edges
4. `cn()` - 16 edges
5. `compilerOptions` - 16 edges
6. `Development frameworks and SDKs` - 16 edges
7. `formatPrice()` - 15 edges
8. `GraphQL Storefront API` - 15 edges
9. `staggerContainer` - 14 edges
10. `getProducts()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `StarRating()` --calls--> `cn()`  [EXTRACTED]
  src/components/sections/Testimonials.tsx → src/lib/utils.ts
- `TestimonialCard()` --calls--> `cn()`  [EXTRACTED]
  src/components/sections/Testimonials.tsx → src/lib/utils.ts
- `AccountContent()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/account/AccountContent.tsx → src/context/AuthContext.tsx
- `CheckoutContent()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/checkout/CheckoutContent.tsx → src/context/AuthContext.tsx
- `Stars()` --calls--> `cn()`  [EXTRACTED]
  src/app/store/[slug]/ProductDetailContent.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (31 total, 5 thin omitted)

### Community 0 - "motion.ts"
Cohesion: 0.06
Nodes (44): cormorant, manrope, metadata, Home(), CartNotification(), CartSidebar(), ClientWrapper(), Benefits (+36 more)

### Community 1 - "ShopifyProductCard.tsx"
Cohesion: 0.11
Nodes (32): CheckoutContent(), ProductPage(), ProductDetailContent(), Stars(), BundleCard(), Navbar(), navLinks, Reviews (+24 more)

### Community 2 - "LoginContent.tsx"
Cohesion: 0.09
Nodes (27): ForgotPasswordContent(), metadata, LoginContent(), LoginForm(), metadata, metadata, getStrength(), SignupContent() (+19 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (41): class-variance-authority, clsx, critters, firebase, framer-motion, lucide-react, next, next-themes (+33 more)

### Community 4 - "devDependencies"
Cohesion: 0.06
Nodes (35): autoprefixer, cross-env, eslint, eslint-config-next, devDependencies, autoprefixer, cross-env, eslint (+27 more)

### Community 5 - "shopify.ts"
Cohesion: 0.09
Nodes (23): AccountContent(), cards, metadata, StorePage(), generateMetadata(), generateStaticParams(), StoreContent(), Footer() (+15 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 7 - "Hero.tsx"
Cohesion: 0.14
Nodes (16): fadeUpReduced, Hero(), heroEntranceReduced, HeroProps, reducedTransition, shimmerLineReduced, HomeHero(), PageLoader() (+8 more)

### Community 8 - "AuthContext.tsx"
Cohesion: 0.14
Nodes (16): AuthContext, AuthContextType, AuthProvider(), clearAuthCookie(), setAuthCookie(), AUTH_COOKIE, appleProvider, auth (+8 more)

### Community 9 - "check-video.mjs"
Cohesion: 0.12
Nodes (11): audio, boxes, code, failures, HERO, MANIFEST, mdat, moov (+3 more)

### Community 10 - "Development frameworks and SDKs"
Cohesion: 0.12
Nodes (16): Android, cURL, Development frameworks and SDKs, Hydrogen, iOS, Node.js, Other, React Router Apps (+8 more)

### Community 11 - "normalize-video.mjs"
Cohesion: 0.22
Nodes (14): encodePoster(), encodeVideo(), ffmpegAvailable(), fmt(), hasAudio(), hasFaststart(), main(), MANIFEST (+6 more)

### Community 12 - "normalize-images.mjs"
Cohesion: 0.28
Nodes (15): centredCrop(), fmtKB(), HEARTS_TARGET, IMAGES_DIR, jpegOpts, listImages(), load(), main() (+7 more)

### Community 13 - "Hey Beautiful — project guide"
Cohesion: 0.14
Nodes (13): Branch naming, Branching strategy, Brand & design system, Build note — Windows path casing, Buttons & shared utilities, Code review, Color palette, Commit / PR (+5 more)

### Community 14 - "check-images.mjs"
Cohesion: 0.31
Nodes (8): checkCardSizes(), checkFillHasSizes(), checkPriority(), checkProductAspect(), fail(), failures, lineAt(), SRC

### Community 15 - "4xx and 5xx status codes"
Cohesion: 0.20
Nodes (10): 400 Bad Request, 402 Payment Required, 403 Forbidden, 404 Not Found, 423 Locked, 4xx and 5xx status codes, 5xx Errors, Internal (+2 more)

### Community 16 - "Token-based authentication"
Cohesion: 0.20
Nodes (10): Authentication, Hydrogen, React Router, Ruby, Shopify API, Storefront API Client, Token-based authentication, Token-based (cURL) (+2 more)

### Community 17 - "GraphQL Storefront API"
Cohesion: 0.22
Nodes (8): GraphQL Storefront API, Operation, Query complexity exceeded error response, Query complexity limit for tokenless access, Rate limits, Resources, Response, Response

### Community 18 - "https://{store\_name}.myshopify.com/api/2026-04/graphql.json"
Cohesion: 0.25
Nodes (8): https://{store\_name}.myshopify.com/api/2026-04/graphql.json, Hydrogen, React Router, Ruby, Shopify API, Storefront API Client, Token-based request, Tokenless request

### Community 19 - "Sample error codes"
Cohesion: 0.29
Nodes (7): 400, 402, 403, 404, 423, 500, Sample error codes

### Community 20 - "Storefront Directives"
Cohesion: 0.29
Nodes (7): @defer, Directives, @inContext (Buyer Identity), @inContext (Country Code), @inContext (Language), @inContext (Visitor Consent), Storefront Directives

### Community 21 - "Status and error codes"
Cohesion: 0.50
Nodes (4): 200 OK, Error handling, Properties, Status and error codes

### Community 22 - "Endpoints and queries"
Cohesion: 0.50
Nodes (4): Endpoints and queries, Graphi​QL explorer, Usage limitations, Versioning

### Community 23 - "route.ts"
Cohesion: 0.67
Nodes (3): isSignatureValid(), POST(), runtime

## Knowledge Gaps
- **216 isolated node(s):** `config`, `nextConfig`, `name`, `version`, `private` (+211 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fadeUp` connect `LoginContent.tsx` to `motion.ts`, `ShopifyProductCard.tsx`, `shopify.ts`, `Hero.tsx`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `GraphQL Storefront API` connect `GraphQL Storefront API` to `Development frameworks and SDKs`, `4xx and 5xx status codes`, `Token-based authentication`, `https://{store\_name}.myshopify.com/api/2026-04/graphql.json`, `Sample error codes`, `Storefront Directives`, `Status and error codes`, `Endpoints and queries`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `config`, `nextConfig`, `name` to the rest of the system?**
  _216 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `motion.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.055191256830601096 - nodes in this community are weakly interconnected._
- **Should `ShopifyProductCard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11436170212765957 - nodes in this community are weakly interconnected._
- **Should `LoginContent.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09065679925994449 - nodes in this community are weakly interconnected._