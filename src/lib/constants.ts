/**
 * Presence hint read by the edge proxy so it can route without a round trip to Firebase.
 *
 * Its value is the literal "1". It is **not** a credential, carries no identity, and must
 * never be treated as proof of authentication or authorization — a visitor can set it by
 * hand from the console. Firebase auth state (and, once there is a server, a verified ID
 * token) is the only authority. Everything protected re-checks the real session
 * client-side; see `src/lib/session.ts` and the guards in `AccountContent` / `CheckoutContent`.
 */
export const SESSION_HINT_COOKIE = "hb-session-hint";

/**
 * Previous name of the hint cookie, kept only so the proxy still recognises browsers that
 * have one from before the rename and sign-out can clear the orphan. Safe to delete once
 * the old cookie's 30-day max-age has lapsed for everyone.
 */
export const LEGACY_SESSION_HINT_COOKIE = "hb-auth-token";

export const REDIRECT_KEY = "hb-redirect-destination";

/**
 * Enforced password floor. Firebase's own minimum is 6; 8 is the widely recognised baseline
 * and costs the user nothing. Lives here because both the signup validation and the
 * `auth/weak-password` message quote it, and those two drifting apart would be confusing.
 */
export const MIN_PASSWORD_LENGTH = 8;

/** Cart and wishlist persistence keys. Cleared on sign-out — see `clearLocalUserState`. */
export const CART_STORAGE_KEY = "hb-cart";
export const WISHLIST_STORAGE_KEY = "hb-wishlist";
