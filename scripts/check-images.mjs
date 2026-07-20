// Guards the image-delivery invariants established in issue #13.
// Runs as part of `npm run lint` (chained after `eslint .`), and standalone
// via `npm run images:check`. Wired into lint in #52, once lint was repaired
// (Next 16 removed `next lint`; the project now uses a flat ESLint config).
//
// HOW THIS WORKS, AND WHAT IT WON'T CATCH
//
// This is regex over source text, not an AST pass. That's a deliberate tradeoff:
// a real parse would mean pulling in a TS/JSX parser as a dependency, and the
// worst case here is a MISSED warning, never a false alarm that blocks a good
// build. It catches the realistic regression — someone adds an <Image fill> and
// forgets `sizes` — and will not catch `sizes` arriving via a spread or a
// variable. If you hit that case, the fix is to add an eslint-disable-style
// comment here rather than to loosen the check for everyone.
//
// Checks 2 and 3 are literal string matches, i.e. brittle ON PURPOSE: anyone
// changing the product aspect ratio or the number of eager-loaded cards should be
// forced to come here and confirm that's intentional.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

/** Product presentation ratio — must match the crop in normalize-images.mjs. */
const PRODUCT_ASPECT_CLASS = "aspect-[4/5]";

/** Cards eagerly loaded at the top of the store grid. Must match StoreContent. */
const EAGER_STORE_CARDS = "priority={index < 4}";

const failures = [];
const fail = (file, line, msg) => failures.push({ file, line, msg });

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.tsx$/.test(e.name)) out.push(p);
  }
  return out;
}

const rel = (f) => path.relative(path.join(SRC, ".."), f).replace(/\\/g, "/");

/** Line number of a character offset, 1-indexed. */
const lineAt = (src, index) => src.slice(0, index).split("\n").length;

/**
 * 1. Every `fill` <Image> must declare `sizes`.
 *
 * Without it Next defaults to sizes="100vw", so the browser picks a candidate off
 * the viewport width — downloading a ~1920px image to paint a 32px avatar.
 */
function checkFillHasSizes(file, src) {
  // Match <Image ... /> — non-greedy up to the self-closing bracket. Good enough:
  // every Image in this codebase is self-closing and none nest.
  for (const m of src.matchAll(/<Image\b[\s\S]*?\/>/g)) {
    const tag = m[0];
    const hasFill = /(?:^|\s)fill(?:\s|=\{true\}|\/?>)/.test(tag);
    const hasSizes = /\bsizes\s*=/.test(tag);
    if (hasFill && !hasSizes) {
      fail(file, lineAt(src, m.index), "<Image fill> without `sizes` — will default to 100vw");
    }
  }
}

/** 2. The product cards must keep the unified 4:5 framing. */
function checkProductAspect(file, src) {
  if (!/(ProductCard|ShopifyProductCard)\.tsx$/.test(file)) return;
  if (!src.includes(PRODUCT_ASPECT_CLASS)) {
    fail(file, 1, `product card must frame its image ${PRODUCT_ASPECT_CLASS} (issue #13)`);
  }
  const stale = src.indexOf("aspect-[3/4]");
  if (stale !== -1) {
    fail(file, lineAt(src, stale), "product card still uses aspect-[3/4]; the source images are 4:5");
  }
}

/**
 * 3. Only the intended cards get `priority`.
 *
 * The store grid eager-loads its first row (its LCP). The homepage featured grid
 * must NOT — it sits below a <video> hero that already preloads itself, so
 * preloading there would contend with the real LCP.
 *
 * That grid is FeaturedProducts -> ShopifyProductCard, and ShopifyProductCard is
 * where an <Image priority> could actually be introduced. FeaturedProducts only
 * delegates to it and never names `priority`, so asserting against FeaturedProducts
 * alone is vacuous — we scan the Image tags of both files instead.
 */
function checkPriority(file, src) {
  if (/StoreContent\.tsx$/.test(file) && !src.includes(EAGER_STORE_CARDS)) {
    fail(file, 1, `store grid must eager-load its first row via \`${EAGER_STORE_CARDS}\``);
  }
  if (/(?:FeaturedProducts|ShopifyProductCard)\.tsx$/.test(file)) {
    for (const m of src.matchAll(/<Image\b[\s\S]*?\/>/g)) {
      const tag = m[0];
      // `priority`, `priority={true}`, or `priority={<expr>}` all eager-load;
      // only an explicit `priority={false}` opts out. A `priority` in prose (e.g.
      // the "no priority here on purpose" comment) sits outside the tag and is
      // never scanned.
      const setsPriority = /(?:^|\s)priority(?:\s|=|\/?>)/.test(tag);
      const explicitlyOff = /\bpriority\s*=\s*\{\s*false\s*\}/.test(tag);
      if (setsPriority && !explicitlyOff) {
        fail(file, lineAt(src, m.index), "homepage featured <Image> must not set `priority` — the LCP is the hero video");
      }
    }
  }
}

const files = await walk(SRC);
for (const file of files) {
  const src = await readFile(file, "utf8");
  checkFillHasSizes(file, src);
  checkProductAspect(file, src);
  checkPriority(file, src);
}

if (failures.length) {
  console.error(`\nimage checks failed (${failures.length}):\n`);
  for (const f of failures) console.error(`  ${rel(f.file)}:${f.line}\n    ${f.msg}\n`);
  process.exit(1);
}

console.log(`image checks passed (${files.length} components)`);
