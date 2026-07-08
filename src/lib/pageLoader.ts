/**
 * Shared session state for the home-page loader. Kept out of the presentational
 * PageLoader component so both it and the HomeHero orchestrator read/write the
 * flag through one place.
 */

/** sessionStorage flag marking that the loader has been shown this session. */
export const LOADER_SESSION_KEY = "hb-loader-shown";

/** True if the loader has already been shown in this browser session. */
export function hasShownLoader(): boolean {
  try {
    return !!sessionStorage.getItem(LOADER_SESSION_KEY);
  } catch {
    return false;
  }
}

/** Record that the loader has been shown this session. */
export function markLoaderShown(): void {
  try {
    sessionStorage.setItem(LOADER_SESSION_KEY, "1");
  } catch {}
}
