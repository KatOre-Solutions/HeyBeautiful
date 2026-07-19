// Guards the hero-video invariants established in issue #11.
//   npm run video:check
//
// Uses ffprobe for everything it can report. The ONE exception is faststart:
// ffprobe has no stable API for atom order — `-show_format` exposes no field for
// it, and the only route is `-v trace`, which is debug output with no
// compatibility contract and would break silently on an ffmpeg upgrade. So that
// single check reads the top-level box headers directly: [4-byte size][4-byte
// type], a layout frozen by ISO/IEC 14496-12. Top-level only — no recursion.
// Please don't "simplify" it back to trace-grepping.
//
// The source-text guards on Hero.tsx are brittle on purpose: they're the things
// a well-meaning future optimizer re-adds without realising what they cost.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VIDEO = path.join(ROOT, "public", "video", "hero-video.mp4");
const POSTER = path.join(ROOT, "public", "video", "hero-poster.webp");
const MANIFEST = path.join(ROOT, "scripts", "video-manifest.json");
const HERO = path.join(ROOT, "src", "components", "sections", "Hero.tsx");

/** Ceilings from the real committed output (1,129,500 / 43,956) plus headroom. */
const MAX_VIDEO_BYTES = 1_300_000;
const MAX_POSTER_BYTES = 120_000;

const failures = [];
const fail = (msg) => failures.push(msg);
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

/** Top-level MP4 boxes. See the header for why this isn't ffprobe. */
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

function ffprobe(args) {
  const r = spawnSync("ffprobe", args, { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
}

const video = await readFile(VIDEO);
const poster = await readFile(POSTER);

// 1. faststart — moov before mdat, so the browser needn't seek to the tail for
//    the index. The regression that would silently undo this PR.
const boxes = topLevelBoxes(video);
const moov = boxes.indexOf("moov");
const mdat = boxes.indexOf("mdat");
if (moov === -1 || mdat === -1) {
  fail(`${rel(VIDEO)}: could not find moov/mdat (boxes: ${boxes.join(" ")})`);
} else if (moov > mdat) {
  fail(
    `${rel(VIDEO)}: NOT faststart — moov comes after mdat (boxes: ${boxes.join(" ")}).\n` +
      `    The browser must range-seek the tail for the index before it can start.\n` +
      `    Fix: npm run video:normalize -- --write --force`,
  );
}

// 2. No audio track — the element is permanently muted, so any audio is dead weight.
const audio = ffprobe([
  "-v", "error", "-select_streams", "a",
  "-show_entries", "stream=codec_type", "-of", "csv=p=0", VIDEO,
]);
if (audio === null) {
  fail("ffprobe not found on PATH — required for the audio-track check. Install ffmpeg.");
} else if (audio.length > 0) {
  fail(`${rel(VIDEO)}: has an audio track (${audio}) — the hero video is muted; re-encode with -an`);
}

// 3. Size ceilings.
if (video.length > MAX_VIDEO_BYTES) {
  fail(`${rel(VIDEO)}: ${video.length} bytes exceeds ceiling ${MAX_VIDEO_BYTES}`);
}
if (poster.length > MAX_POSTER_BYTES) {
  fail(`${rel(POSTER)}: ${poster.length} bytes exceeds ceiling ${MAX_POSTER_BYTES}`);
}

// 4. Poster is not stale.
//    Content hash, not mtime: git doesn't store mtimes, so on a fresh clone every
//    file carries checkout time in arbitrary order and a timestamp compare is noise.
try {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  const actual = createHash("sha256").update(video).digest("hex");
  if (manifest.videoSha256 !== actual) {
    fail(
      `${rel(POSTER)} was generated from a different ${rel(VIDEO)}.\n` +
        `    manifest: ${manifest.videoSha256.slice(0, 16)}…  actual: ${actual.slice(0, 16)}…\n` +
        `    The video changed without regenerating the poster, so the poster shows the old first frame.\n` +
        `    Fix: npm run video:normalize -- --write --force`,
    );
  }
} catch (err) {
  fail(`${rel(MANIFEST)}: unreadable (${err.message}) — run npm run video:normalize -- --write`);
}

// 5. Hero.tsx source guards.
const hero = await readFile(HERO, "utf8");

// Blank out comments rather than deleting them: the prose here explains why
// autoPlay is absent and would otherwise trip the check on itself, but keeping
// the line count intact means reported line numbers still point at real code.
const code = hero
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
  .replace(/\/\/[^\n]*/g, (m) => " ".repeat(m.length));

const lineOf = (re) => {
  const i = code.search(re);
  return i === -1 ? 0 : code.slice(0, i).split("\n").length;
};

if (/\bautoPlay\b/.test(code)) {
  fail(
    `${rel(HERO)}:${lineOf(/autoPlay/)}: <video> must not use autoPlay.\n` +
      `    autoPlay starts the fetch regardless of preload="none", which defeats the\n` +
      `    reduced-motion and Save-Data paths. The effect drives load()/play() instead.`,
  );
}
if (!/preload="none"/.test(code)) {
  fail(`${rel(HERO)}: <video> must set preload="none" — the effect decides whether to load.`);
}
if (!/poster=\{HERO_POSTER_SRC\}/.test(code)) {
  fail(`${rel(HERO)}: <video> must set poster={HERO_POSTER_SRC} — it carries first paint.`);
}
if (/as:\s*"video"/.test(code)) {
  fail(
    `${rel(HERO)}:${lineOf(/as:\s*"video"/)}: must not preload() the video.\n` +
      `    A <link> in the SSR'd head can't be withdrawn, so Save-Data users would\n` +
      `    download it anyway. Preload the poster instead.`,
  );
}

if (failures.length) {
  console.error(`\nvideo checks failed (${failures.length}):\n`);
  for (const f of failures) console.error(`  ${f}\n`);
  process.exit(1);
}

console.log(
  `video checks passed — ${rel(VIDEO)} ${(video.length / 1024).toFixed(1)}KB (faststart, no audio), ` +
    `${rel(POSTER)} ${(poster.length / 1024).toFixed(1)}KB`,
);
