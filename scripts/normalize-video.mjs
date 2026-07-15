// Normalizes the hero background video and generates its poster (issue #11).
//
// Committed rather than run ad-hoc for two reasons: the outputs are tracked
// binaries a reviewer must be able to regenerate, and the poster MUST stay in
// sync with the mp4 it was cut from — only a script guarantees that.
//
//   npm run video:normalize             # dry run — prints what would change
//   npm run video:normalize -- --write  # apply
//   npm run video:normalize -- --write --force   # re-encode even if already normalized
//
// Requires ffmpeg on PATH (system binary, not an npm dep — see preflight below).
//
// The master lives in git history, not in the repo. To recover the original
// 3.7MB source:
//   git log --oneline -- public/video/hero-video.mp4
//   git show <sha>:public/video/hero-video.mp4 > master.mp4

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VIDEO = path.join(ROOT, "public", "video", "hero-video.mp4");
const POSTER = path.join(ROOT, "public", "video", "hero-poster.webp");
const MANIFEST = path.join(ROOT, "scripts", "video-manifest.json");

/**
 * x264 quality. The hero is a soft background plate behind a warm tint overlay
 * and a scale(1.05) crop, so it tolerates far more compression than its 3.5 Mbps
 * source implied. 28 measured at SSIM 0.977 vs the master while cutting 69% of
 * the bytes; 26 (0.981) costs +27% for a difference you cannot see through the
 * overlay. Re-measure with `ffmpeg -lavfi ssim` if the master ever changes.
 */
const CRF = 28;

/** Pinned: preset changes output size, and the size guard in check-video.mjs is calibrated to it. */
const PRESET = "slow";

/** Poster quality. Frame 0 only; it hands over to the video within ~1s. */
const POSTER_QUALITY = 82;

function ffmpegAvailable() {
  const r = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  return r.status === 0;
}

function run(args) {
  const r = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg failed:\n${r.stderr?.slice(-800)}`);
  return r;
}

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

/**
 * Top-level MP4 box scan: [4-byte big-endian size][4-byte type], repeat.
 *
 * Hand-rolled because ffprobe cannot report atom ORDER — `-show_format` has no
 * field for it, and the only route is `-v trace`, which is debug output with no
 * compatibility contract. This layout is frozen by ISO/IEC 14496-12. Top-level
 * only: no recursion, no hdlr. (Audio detection uses ffprobe — see check-video.mjs.)
 */
function topLevelBoxes(buf) {
  const boxes = [];
  let off = 0;
  while (off + 8 <= buf.length) {
    let size = buf.readUInt32BE(off);
    const type = buf.toString("latin1", off + 4, off + 8);
    if (size === 1) size = Number(buf.readBigUInt64BE(off + 8));
    if (size < 8) break;
    boxes.push(type);
    off += size;
  }
  return boxes;
}

/** moov before mdat — the browser can start without seeking to the tail for the index. */
function hasFaststart(buf) {
  const b = topLevelBoxes(buf);
  return b.includes("moov") && b.includes("mdat") && b.indexOf("moov") < b.indexOf("mdat");
}

function hasAudio(file) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "a", "-show_entries", "stream=codec_type", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  );
  return r.status === 0 && r.stdout.trim().length > 0;
}

/**
 * Re-encode: strip audio (the element is permanently muted), drop the source's
 * uuid metadata atom, and move moov to the front.
 */
function encodeVideo(input, output) {
  run([
    "-y", "-i", input,
    "-an",
    "-map_metadata", "-1",
    "-c:v", "libx264",
    "-profile:v", "high",
    "-pix_fmt", "yuv420p",
    "-crf", String(CRF),
    "-preset", PRESET,
    "-movflags", "+faststart",
    output,
  ]);
}

/**
 * Poster = frame 0 of the ENCODED output, never the master.
 *
 * Two reasons. The poster is replaced by frame 0 at play, so cutting it from a
 * higher-quality master makes that swap a visible pop. And frame 0 specifically:
 * the clip is one continuous shot that darkens ~21% over its 8s (YAVG 134 -> 106),
 * so any later frame would be visibly darker than the video's opening.
 *
 * WebP via ffmpeg's libwebp: <video poster> takes a plain URL and cannot go
 * through next/image, so the source file must be the delivery format.
 */
function encodePoster(input, output) {
  run([
    "-y", "-i", input,
    "-frames:v", "1",
    "-c:v", "libwebp",
    "-quality", String(POSTER_QUALITY),
    "-compression_level", "6",
    output,
  ]);
}

const fmt = (b) => `${(b / 1024).toFixed(1)}KB`;

async function main() {
  const write = process.argv.includes("--write");
  const force = process.argv.includes("--force");

  if (!ffmpegAvailable()) {
    console.error(
      "ffmpeg is required but was not found on PATH.\n" +
        "  Windows: winget install Gyan.FFmpeg\n" +
        "  macOS:   brew install ffmpeg\n" +
        "  Linux:   apt install ffmpeg",
    );
    process.exit(1);
  }

  const original = await readFile(VIDEO);
  const beforeSize = original.length;
  const normalized = hasFaststart(original) && !hasAudio(VIDEO);

  console.log(write ? "Normalizing hero video (WRITING)\n" : "Normalizing hero video (dry run — pass --write to apply)\n");
  console.log(`  source          ${fmt(beforeSize)}  boxes: ${topLevelBoxes(original).join(" ")}`);
  console.log(`  faststart       ${hasFaststart(original)}`);
  console.log(`  audio track     ${hasAudio(VIDEO)}`);

  // Idempotence: re-encoding an already-encoded file is generational loss, and
  // unlike a JPEG re-encode it is not marginal. Detect via the same properties
  // check-video.mjs asserts.
  if (normalized && !force) {
    console.log("\n  Already normalized (faststart + no audio) — skipping encode. Use --force to override.");
    if (!write) console.log("\n  Dry run — nothing written.");
    return;
  }

  const tmpVideo = `${VIDEO}.tmp.mp4`;
  const tmpPoster = `${POSTER}.tmp.webp`;

  encodeVideo(VIDEO, tmpVideo);
  encodePoster(tmpVideo, tmpPoster);

  const encoded = await readFile(tmpVideo);
  const posterSize = (await stat(tmpPoster)).size;

  console.log(`\n  encoded         ${fmt(beforeSize)} -> ${fmt(encoded.length)}  (${(100 - (encoded.length / beforeSize) * 100).toFixed(0)}% smaller)`);
  console.log(`  boxes           ${topLevelBoxes(encoded).join(" ")}`);
  console.log(`  faststart       ${hasFaststart(encoded)}`);
  console.log(`  poster          ${fmt(posterSize)}  (frame 0, webp q${POSTER_QUALITY})`);

  if (!write) {
    const { unlink } = await import("node:fs/promises");
    await unlink(tmpVideo);
    await unlink(tmpPoster);
    console.log("\n  Dry run — nothing written. Re-run with --write to apply.");
    return;
  }

  await rename(tmpVideo, VIDEO);
  await rename(tmpPoster, POSTER);

  // Records which mp4 the poster was cut from, so check-video.mjs can catch a
  // video swapped without regenerating the poster. Content hash, not mtime:
  // git does not store mtimes, so a clone stamps every file with checkout time.
  await writeFile(
    MANIFEST,
    JSON.stringify(
      {
        _comment: "Written by scripts/normalize-video.mjs. Verified by scripts/check-video.mjs. Do not hand-edit.",
        video: "public/video/hero-video.mp4",
        poster: "public/video/hero-poster.webp",
        videoSha256: sha256(encoded),
        videoBytes: encoded.length,
        posterBytes: posterSize,
        crf: CRF,
        preset: PRESET,
      },
      null,
      2,
    ) + "\n",
  );

  console.log(`\n  wrote ${path.relative(ROOT, VIDEO)}`);
  console.log(`  wrote ${path.relative(ROOT, POSTER)}`);
  console.log(`  wrote ${path.relative(ROOT, MANIFEST)}`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
