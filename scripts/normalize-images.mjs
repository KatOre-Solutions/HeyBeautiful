// Normalizes the source images in public/images (issue #13).
//
// Why this exists as a committed script rather than a one-off: the outputs are
// binaries checked into the repo, so a reviewer needs to be able to regenerate
// them — especially when the designer delivers re-rendered artwork (see the
// artwork issue linked from #13). The recipe lives here, not in someone's shell
// history.
//
//   npm run images:normalize           # dry run — prints every planned change
//   npm run images:normalize -- --write  # actually overwrite the files
//
// Dry run is the default on purpose: this rewrites tracked source files in
// place. It is deliberately NOT wired into `build` — it must never run on
// Netlify.
//
// Idempotence: *geometry* is idempotent — a second run re-crops nothing (the
// product/logo helpers skip at target, and the crop helpers fall through to
// re-encode once a file already matches its ratio). That's the guard that
// matters, since a repeated crop would erode the image. Re-encoding a JPEG is
// still marginally lossy though (~0.4% on a no-op run), so this is meant to be
// run once against fresh artwork, not on a loop.

import sharp from "sharp";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Always hand sharp a Buffer, never a path.
 *
 * On Windows, `sharp(path)` keeps a read handle on the file, and overwriting the
 * same path while that handle is open fails with EUNKNOWN (errno -4094). Since
 * this script rewrites its inputs in place, reading the bytes up front is the
 * only reliable way to do it.
 */
async function load(file) {
  return sharp(await readFile(file));
}

const IMAGES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "images",
);

/**
 * Deviation-from-background, 0-255, above which a pixel counts as the solid
 * product rather than its drop shadow. Used to *verify* the crop (below), not to
 * position it.
 *
 * This threshold exists because the mockups cast a soft shadow to the right that
 * reaches ~250px past the product. Any bounding box that includes the shadow has
 * its centre dragged right by ~90px, so cropping to a shadow-inclusive bbox lands
 * the product visibly LEFT of centre. Measuring the *product* means ignoring the
 * shadow, which is what this separates.
 *
 * 60 sits in the middle of a wide stable plateau — the measured product centre
 * moves by <2px across thresholds from 50 to 120 — so it is not a tuned magic
 * number. Re-check that plateau if a future artwork export changes the product's
 * contrast against its background (e.g. a white product on a white sweep, where
 * the product edge itself deviates less than the shadow does).
 */
const OBJECT_THRESHOLD = 60;

/** Product must sit within this many px of the crop's centre, else we flag it. */
const MAX_CENTRE_SKEW = 40;

/** Product presentation ratio, unified across cards + detail + minis (issue #13). */
const PRODUCT_ASPECT = 4 / 5;

/**
 * JPEG quality for re-encodes. 80 with mozjpeg lands visually lossless on these
 * flat-background renders while cutting the oversized sources hard. Note this is
 * unrelated to next/image's `quality` (which stays at its default 75) — this is
 * the quality of the *source* the optimizer then re-encodes from.
 */
const JPEG_QUALITY = 80;

const jpegOpts = { quality: JPEG_QUALITY, mozjpeg: true };

/** logo.jpeg renders at 36-40px; 256 covers DPR3 with room to spare. */
const LOGO_TARGET = 256;

/** logo-hearts-white.png renders at 140-180px; 768 covers DPR4. Ratio preserved. */
const HEARTS_TARGET = { width: 768, height: 732 };

// ---------------------------------------------------------------------------
// helpers — one per asset class
// ---------------------------------------------------------------------------

/** Centre-crop geometry for a target ratio, clamped inside the source. */
function centredCrop(width, height, aspect) {
  let w = Math.round(height * aspect);
  let h = height;
  if (w > width) {
    w = width;
    h = Math.round(width / aspect);
  }
  return {
    left: Math.round((width - w) / 2),
    top: Math.round((height - h) / 2),
    width: w,
    height: h,
  };
}

/**
 * Horizontal extent of the solid product, ignoring its drop shadow.
 *
 * Walks the per-column maximum deviation from the background (sampled at the
 * top-left corner, which is always empty sweep) and returns the first/last column
 * that clears OBJECT_THRESHOLD. Used only to verify the crop.
 */
async function productExtent(file) {
  const { data, info } = await (await load(file)).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const bg = [data[0], data[1], data[2]];

  const colMax = new Array(width).fill(0);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const d = Math.max(
        Math.abs(data[i] - bg[0]),
        Math.abs(data[i + 1] - bg[1]),
        Math.abs(data[i + 2] - bg[2]),
      );
      if (d > colMax[x]) colMax[x] = d;
    }
  }

  const left = colMax.findIndex((v) => v > OBJECT_THRESHOLD);
  let right = width - 1;
  while (right >= 0 && colMax[right] <= OBJECT_THRESHOLD) right--;
  return { left, right };
}

/**
 * item-1..5: centred 4:5 crop.
 *
 * A plain centred crop is correct here, and deliberately so. The products are
 * already centred in the source — measured product centres land at x=801..812
 * against a frame centre of 800. (An earlier version of this script centred on a
 * sharp.trim() bounding box instead, which looked like it was correcting a
 * 67-103px rightward offset. It wasn't: trim() includes the drop shadow, which
 * casts ~250px to the right and drags the bbox centre with it. Centring on that
 * bbox pushed the actual product ~90px LEFT of centre — same error, opposite
 * sign.)
 *
 * The resulting window (x=374..1226 out of 1600) is also exactly what the 4:5
 * detail page already shows via object-cover today, so the detail view is
 * pixel-identical after this crop, and the card — which currently clips to
 * x=400..1200 at 3:4 — actually gains a little breathing room.
 *
 * Vertically the products are baseline-aligned, so full height (top: 0) preserves
 * the baseline for free.
 */
async function normalizeProductImage(file) {
  const { width, height } = await (await load(file)).metadata();
  const region = centredCrop(width, height, PRODUCT_ASPECT);

  // Idempotence: derived from the ratio, not a hardcoded pixel pair, so it can't
  // drift out of sync with centredCrop's rounding. If the crop would be a no-op
  // the file is already 4:5 — leave it alone rather than re-encode it every run.
  if (region.width === width && region.height === height) {
    return { file, action: "skip", reason: "already 4:5" };
  }

  const { left: pl, right: pr } = await productExtent(file);

  return {
    file,
    action: "crop",
    from: { width, height },
    to: { width: region.width, height: region.height },
    region,
    // Gap between each crop edge and the solid product. Both must be positive
    // (nothing clipped) and roughly equal (product reads as centred).
    margins: { left: pl - region.left, right: region.left + region.width - pr },
    pipeline: (s) => s.extract(region).jpeg(jpegOpts),
  };
}

/**
 * Lifestyle/editorial shots. `aspect` pre-crops to the ratio the CSS already
 * shows via object-cover, which is why these are visually lossless: the browser
 * is discarding exactly this much today, we're just doing it once at build time
 * instead of shipping the bytes. Omit `aspect` to re-encode only.
 */
async function normalizeLifestyleImage(file, { aspect } = {}) {
  const { width, height } = await (await load(file)).metadata();

  if (!aspect) return reencodeOnly(file, { width, height });

  const region = centredCrop(width, height, aspect);
  if (region.width === width && region.height === height) {
    return reencodeOnly(file, { width, height });
  }

  return {
    file,
    action: "crop",
    from: { width, height },
    to: { width: region.width, height: region.height },
    region,
    pipeline: (s) => s.extract(region).jpeg(jpegOpts),
  };
}

/** Testimonial stories — same treatment, kept separate so artwork drops are reviewable per class. */
async function normalizeTestimonialImage(file, { aspect } = {}) {
  return normalizeLifestyleImage(file, { aspect });
}

/**
 * Logos. logo.jpeg stays JPEG deliberately: it has no alpha (the circle comes
 * from CSS `rounded-full overflow-hidden`) and it's a soft rendered mark, so PNG
 * would be several times larger. Only the resolution is wasteful.
 */
async function normalizeLogo(file, { width: tw, height: th }) {
  const { width, height, format } = await (await load(file)).metadata();

  if (width <= tw) return { file, action: "skip", reason: "already at or below target" };

  const resize = { width: tw, ...(th ? { height: th } : {}) };
  return {
    file,
    action: "resize",
    from: { width, height },
    to: { width: tw, height: th ?? Math.round((height / width) * tw) },
    pipeline: (s) =>
      format === "png" ? s.resize(resize).png({ compressionLevel: 9 }) : s.resize(resize).jpeg(jpegOpts),
  };
}

/** Shared tail: re-encode at the target quality without changing geometry. */
async function reencodeOnly(file, meta) {
  const { width, height } = meta ?? (await (await load(file)).metadata());
  return {
    file,
    action: "reencode",
    from: { width, height },
    to: { width, height },
    pipeline: (s) => s.jpeg(jpegOpts),
  };
}

// ---------------------------------------------------------------------------
// dispatch
// ---------------------------------------------------------------------------

/**
 * Which helper handles which file. `inspo-*` and `product-mock-up` are re-encode
 * only on purpose: inspo-* is used at five different ratios (avatar, gallery
 * slide, bundle hero), so cropping to any one breaks the others; product-mock-up
 * is the OpenGraph image and its product is wider than a 4:5 crop would allow.
 */
function planFor(name) {
  if (/^item-[1-5]\.jpeg$/.test(name)) return () => normalizeProductImage(path.join(IMAGES_DIR, name));

  if (name === "model.jpeg")
    return () => normalizeLifestyleImage(path.join(IMAGES_DIR, name), { aspect: PRODUCT_ASPECT });
  if (name === "model-2.jpeg")
    return () => normalizeLifestyleImage(path.join(IMAGES_DIR, name), { aspect: 3 / 4 });

  if (name === "testimonials/story-3.jpeg")
    return () => normalizeTestimonialImage(path.join(IMAGES_DIR, name), { aspect: 3 / 4 });
  if (name === "testimonials/story-4.jpeg")
    return () => normalizeTestimonialImage(path.join(IMAGES_DIR, name), { aspect: 4 / 3 });
  if (/^testimonials\/story-[12]\.jpeg$/.test(name))
    return () => normalizeTestimonialImage(path.join(IMAGES_DIR, name));

  if (name === "logo.jpeg")
    return () => normalizeLogo(path.join(IMAGES_DIR, name), { width: LOGO_TARGET, height: LOGO_TARGET });
  if (name === "logo-hearts-white.png")
    return () => normalizeLogo(path.join(IMAGES_DIR, name), HEARTS_TARGET);

  if (/^inspo-[1-6]\.jpeg$/.test(name) || name === "product-mock-up.jpeg" || name === "product-model.jpeg")
    return () => normalizeLifestyleImage(path.join(IMAGES_DIR, name));

  return null;
}

async function listImages(dir, prefix = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    if (e.isDirectory()) out.push(...(await listImages(path.join(dir, e.name), `${prefix}${e.name}/`)));
    else if (/\.(jpe?g|png)$/i.test(e.name)) out.push(`${prefix}${e.name}`);
  }
  return out;
}

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`;
}

async function main() {
  const write = process.argv.includes("--write");
  const names = (await listImages(IMAGES_DIR)).sort();

  let totalBefore = 0;
  let totalAfter = 0;
  let failed = false;

  console.log(write ? "Normalizing images (WRITING)\n" : "Normalizing images (dry run — pass --write to apply)\n");

  for (const name of names) {
    const build = planFor(name);
    if (!build) {
      console.log(`  ${name.padEnd(34)} — no rule, untouched`);
      continue;
    }

    const plan = await build();
    const full = path.join(IMAGES_DIR, name);
    const before = (await stat(full)).size;
    totalBefore += before;

    if (plan.action === "skip") {
      totalAfter += before;
      console.log(`  ${name.padEnd(34)} skip (${plan.reason})`);
      continue;
    }

    const buf = await plan.pipeline(await load(full)).toBuffer();
    totalAfter += buf.length;

    const dims = `${plan.from.width}x${plan.from.height} -> ${plan.to.width}x${plan.to.height}`;
    let line = `  ${name.padEnd(34)} ${plan.action.padEnd(8)} ${dims.padEnd(24)} ${fmtKB(before)} -> ${fmtKB(buf.length)}`;

    if (plan.margins) {
      const { left, right } = plan.margins;
      const skew = Math.abs(left - right);
      // Two assertions, both real failures:
      //   negative margin -> the crop clips the product
      //   large skew      -> the product no longer reads as centred
      const clipped = left < 0 || right < 0;
      const skewed = skew > MAX_CENTRE_SKEW;
      line += `  product margins L=${left} R=${right}`;
      if (clipped) line += "  <-- CLIPPED";
      else if (skewed) line += `  <-- OFF-CENTRE by ${skew}px`;
      if (clipped || skewed) failed = true;
    }

    console.log(line);

    if (write) await writeFile(full, buf);
  }

  console.log(
    `\n  total ${fmtKB(totalBefore)} -> ${fmtKB(totalAfter)}  (${(
      (1 - totalAfter / totalBefore) * 100
    ).toFixed(1)}% smaller)`,
  );

  if (failed) {
    console.error("\nFAIL: a crop would clip its product. Re-tune TRIM_THRESHOLD or the target.");
    process.exit(1);
  }
  if (!write) console.log("\n  Dry run — nothing written. Re-run with --write to apply.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
