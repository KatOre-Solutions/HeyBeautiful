import {
  CART_STORAGE_KEY,
  LEGACY_SESSION_HINT_COOKIE,
  REDIRECT_KEY,
  SESSION_HINT_COOKIE,
  WISHLIST_STORAGE_KEY,
} from "@/lib/constants";

/**
 * Owns the presence hint cookie and the local traces of a signed-in session.
 *
 * The hint exists for one reason: the edge proxy runs before any Firebase SDK and needs
 * *some* signal to decide whether to render a protected route or bounce to /login. It is a
 * routing convenience, nothing more — see the contract on `SESSION_HINT_COOKIE`. Anything
 * that actually matters re-checks `onAuthStateChanged` once Firebase has loaded, and clears
 * a hint that turns out to be lying.
 *
 * ## Lifetime
 *
 * The hint is written to match Firebase's own persistence choice, so the two can't drift:
 *
 * - "Remember me" on  → `browserLocalPersistence` → 30-day cookie.
 * - "Remember me" off → `browserSessionPersistence` → **session** cookie (no `max-age`),
 *   so it dies when the browser closes, exactly as the Firebase session does.
 *
 * The choice is mirrored in `sessionStorage` because that storage has precisely the
 * lifetime we need to mirror: it survives reloads within the browsing session and is gone
 * once the browser closes, which is the same boundary `browserSessionPersistence` uses.
 * Without it, a reload would re-stamp a 30-day cookie over a session-only login and leave a
 * stale hint behind for a month.
 */

const SESSION_ONLY_KEY = "hb-session-only";
const PERSISTENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function cookieSuffix(): string {
  return location.protocol === "https:" ? "; Secure" : "";
}

/** True when this login opted out of "remember me" and must not outlive the browser. */
export function isSessionOnly(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SESSION_ONLY_KEY) === "1";
  } catch {
    return false;
  }
}

/** Records the "remember me" choice so a later reload writes the matching cookie. */
export function markSessionOnly(sessionOnly: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionOnly) sessionStorage.setItem(SESSION_ONLY_KEY, "1");
    else sessionStorage.removeItem(SESSION_ONLY_KEY);
  } catch {
    // Storage unavailable — fall back to a persistent hint, which the client-side guards
    // will invalidate anyway once Firebase reports no user.
  }
}

/** Writes the presence hint, matched to the persistence the session was created with. */
export function setSessionHint(): void {
  if (typeof document === "undefined") return;
  const age = isSessionOnly() ? "" : `; max-age=${PERSISTENT_MAX_AGE_SECONDS}`;
  document.cookie = `${SESSION_HINT_COOKIE}=1; path=/${age}; SameSite=Lax${cookieSuffix()}`;
}

/** Removes the presence hint, including any cookie left over from the previous name. */
export function clearSessionHint(): void {
  if (typeof document === "undefined") return;
  const suffix = cookieSuffix();
  for (const name of [SESSION_HINT_COOKIE, LEGACY_SESSION_HINT_COOKIE]) {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${suffix}`;
  }
}

/**
 * Wipes the local traces of a session on explicit sign-out: the hint, the "remember me"
 * marker, the pending redirect destination, and the cart/wishlist.
 *
 * Cart and wishlist are cleared because they persist to `localStorage` under fixed keys
 * with no user scoping, so on a shared device the next person would otherwise open the bag
 * and find the previous user's items. Clearing storage here closes the durable leak; the
 * in-memory React state is reset by the sign-out call sites, which own those contexts
 * (`AuthProvider` sits above them and can't reach their hooks).
 *
 * Deliberately *not* called on session expiry — losing a bag because a token lapsed would
 * be a nasty surprise. Only an explicit sign-out clears shopping state.
 */
export function clearLocalUserState(): void {
  clearSessionHint();
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_ONLY_KEY);
    sessionStorage.removeItem(REDIRECT_KEY);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(WISHLIST_STORAGE_KEY);
  } catch {
    // Storage unavailable — nothing durable was written either.
  }
}
