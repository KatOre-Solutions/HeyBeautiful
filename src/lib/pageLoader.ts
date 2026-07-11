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

/**
 * Engage the first-visit loader lock: hide body scroll (compensating for the
 * removed scrollbar so fixed/centered content doesn't shift horizontally) and
 * make the obscured page content inert + aria-busy for assistive tech while the
 * loader covers it. Returns an idempotent `release` that restores everything;
 * calling it more than once is a no-op, so the exit-complete and unmount paths
 * can both call it safely.
 */
export function engagePageLock(rootSelector: string): () => void {
  const root = document.querySelector(rootSelector);

  const scrollbar = window.innerWidth - document.documentElement.clientWidth;
  const previousOverflow = document.body.style.overflow;
  const previousPaddingRight = document.body.style.paddingRight;
  document.body.style.overflow = "hidden";
  if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

  root?.setAttribute("inert", "");
  root?.setAttribute("aria-busy", "true");

  let released = false;
  return () => {
    if (released) return;
    released = true;
    document.body.style.overflow = previousOverflow;
    document.body.style.paddingRight = previousPaddingRight;
    root?.removeAttribute("inert");
    root?.removeAttribute("aria-busy");
  };
}
