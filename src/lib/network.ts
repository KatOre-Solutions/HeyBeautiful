/**
 * Network-aware loading decisions.
 *
 * `navigator.connection` is a non-standard Chromium API. Everything here is
 * best-effort: absent means "assume a normal connection", never "block".
 */

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
}

function connection(): NetworkInformation | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

/**
 * Whether to download the hero background video, or stay on the poster.
 *
 * Callers get a decision, not a reason — the heuristics live here so the hero
 * doesn't have to care which one said no.
 *
 * Note `effectiveType` is a browser-supplied *estimate* (round-trip and
 * throughput bucketed into four labels), not a measurement: browsers classify
 * differently, it lags real conditions, and DevTools throttling changes it. So
 * it's only used to catch the genuinely unusable end, never to make finer calls
 * — `3g` still gets the video.
 */
export function shouldLoadHeroVideo(): boolean {
  const c = connection();
  if (!c) return true; // Safari/Firefox: no signal, so don't withhold the video.
  if (c.saveData === true) return false;
  return c.effectiveType !== "2g" && c.effectiveType !== "slow-2g";
}
