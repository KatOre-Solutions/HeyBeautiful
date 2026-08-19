import { MIN_PASSWORD_LENGTH } from "@/lib/constants";

/**
 * The one place Firebase auth error codes are interpreted.
 *
 * Everything user-facing goes through `getAuthErrorMessage`; anything that needs to *branch*
 * on a specific failure uses a named predicate from this file rather than reaching for a
 * raw `err.code` comparison. That keeps a code like `auth/user-not-found` — which is an
 * account-enumeration oracle (see Phase 7) — from being re-interpreted somewhere else with
 * a message that gives the game away.
 *
 * Note there is no `firebase/app` import and no `instanceof FirebaseError`. The shape is
 * duck-typed instead: an object with a string `code` beginning `auth/`. `instanceof` breaks
 * when a bundle ends up with two copies of the Firebase SDK — a real and very confusing
 * failure mode — and this check can't. It also keeps the module free of SDK imports, so it
 * is pure, cheap and directly testable.
 */

interface AuthErrorShape {
  code: string;
  customData?: { email?: unknown } | undefined;
}

function asAuthError(err: unknown): AuthErrorShape | null {
  if (typeof err !== "object" || err === null) return null;
  const code = (err as { code?: unknown }).code;
  if (typeof code !== "string" || !code.startsWith("auth/")) return null;
  return err as AuthErrorShape;
}

/** The raw code, for diagnostics and tests. Never shown to a user. */
export function authErrorCode(err: unknown): string | null {
  return asAuthError(err)?.code ?? null;
}

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

/**
 * Codes the user should never see a message for, because they *are* the user's decision:
 * they closed the popup, or opened a second one. Surfacing an error for a deliberate
 * cancellation reads as a malfunction. `auth/popup-blocked` is here too — it's handled by
 * silently falling back to a full-page redirect, so there is nothing to report.
 */
const SILENT_CODES = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/popup-blocked",
  "auth/user-cancelled",
]);

/**
 * These three must stay identical. "Incorrect password" confirms an account exists and
 * "no account found" confirms it doesn't — either turns the sign-in form into a membership
 * oracle. One indistinguishable answer closes that. Do not split them.
 */
const CREDENTIAL_MESSAGE = "Incorrect email or password. Please try again.";

const MESSAGES: Record<string, string> = {
  // --- credentials (deliberately indistinguishable) ---
  "auth/invalid-credential": CREDENTIAL_MESSAGE,
  "auth/wrong-password": CREDENTIAL_MESSAGE,
  "auth/user-not-found": CREDENTIAL_MESSAGE,

  // --- input the user can fix ---
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/missing-password": "Please enter your password.",
  "auth/missing-email": "Please enter your email address.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": `Please choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`,

  // --- account state ---
  "auth/user-disabled": "This account has been disabled. Please contact support.",
  "auth/account-exists-with-different-credential":
    "An account already exists for this email. Please sign in using the method you first signed up with.",
  "auth/requires-recent-login":
    "For your security, please sign in again before making this change.",

  // --- provider linking (see docs/auth-account-management.md) ---
  // No caller yet. They live here so the linking work lands in one place instead of
  // sprouting the scattered `err.code` checks this module exists to prevent.
  "auth/credential-already-in-use":
    "That account is already connected to a different Hey Beautiful account.",
  "auth/provider-already-linked":
    "That sign-in method is already connected to your account.",
  "auth/no-such-provider":
    "That sign-in method isn't connected to your account.",

  // --- one-time links (verification / password reset) ---
  "auth/invalid-action-code":
    "That link is no longer valid. Please request a new one.",
  "auth/expired-action-code":
    "That link has expired. Please request a new one.",

  // --- transient / environmental ---
  "auth/too-many-requests":
    "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed":
    "Connection error. Please check your internet and try again.",
  "auth/web-storage-unsupported":
    "Your browser is blocking the storage we need to sign you in. Try turning off private browsing or third-party cookie blocking.",

  // --- misconfiguration: say nothing about *what* is misconfigured ---
  "auth/operation-not-allowed": "That sign-in method isn't available right now.",
  "auth/unauthorized-domain": "Sign-in isn't available from this address.",
  "auth/internal-error": GENERIC_MESSAGE,
};

/**
 * Turns any thrown value into something safe to show a user.
 *
 * Returns `""` for cancellations the UI should stay quiet about — callers check for the
 * empty string rather than assuming every failure deserves a toast.
 */
export function getAuthErrorMessage(err: unknown): string {
  const authError = asAuthError(err);
  if (!authError) {
    // Deliberately does NOT fall back to `err.message`. A stray TypeError from our own code
    // would otherwise be rendered verbatim in the UI, leaking internals and reading as
    // gibberish. Unknown failures get the generic line; the console keeps the detail.
    if (err) console.error("Unmapped auth failure:", err);
    return GENERIC_MESSAGE;
  }

  if (SILENT_CODES.has(authError.code)) return "";

  const message = MESSAGES[authError.code];
  if (message) return message;

  // A Firebase code we haven't mapped. The user gets the generic line; the code goes to the
  // console so it can be added here rather than silently ignored forever.
  console.warn(`Unmapped Firebase auth code: ${authError.code}`);
  return GENERIC_MESSAGE;
}

/** True when the failure is a deliberate cancellation the UI should not report. */
export function isSilentAuthError(err: unknown): boolean {
  const code = authErrorCode(err);
  return code !== null && SILENT_CODES.has(code);
}

/** Firebase refused because the caller is going too fast — back off rather than retry. */
export function isRateLimitError(err: unknown): boolean {
  return authErrorCode(err) === "auth/too-many-requests";
}

/** Sign-up refused: the address already has an account. */
export function isEmailInUseError(err: unknown): boolean {
  return authErrorCode(err) === "auth/email-already-in-use";
}

/** A social sign-in clashed with an account created via a different provider. */
export function isCredentialConflictError(err: unknown): boolean {
  return authErrorCode(err) === "auth/account-exists-with-different-credential";
}

/**
 * No account for this address. Callers must be careful: surfacing this distinctly is an
 * enumeration oracle, which is why `resetPassword` swallows it entirely.
 */
export function isUserNotFoundError(err: unknown): boolean {
  return authErrorCode(err) === "auth/user-not-found";
}

/**
 * Whether a popup attempt failed for an environmental reason worth retrying as a full-page
 * redirect. Cancellations are excluded on purpose — the user chose to stop, and bouncing
 * them into a redirect would override that.
 */
export function isPopupFallbackError(err: unknown): boolean {
  const code = authErrorCode(err);
  return (
    code === "auth/popup-blocked" ||
    code === "auth/operation-not-supported-in-this-environment"
  );
}

/**
 * The address behind a credential conflict, when Firebase supplied one.
 *
 * Safe to show back to this user: they just authenticated with a provider *for that
 * address*, so it reveals nothing they didn't supply. We stop there and never look up which
 * providers the account has — `fetchSignInMethodsForEmail` is the same enumeration surface
 * Phase 7 closed, and enumeration protection makes it useless anyway.
 */
export function getConflictEmail(err: unknown): string | null {
  const email = asAuthError(err)?.customData?.email;
  return typeof email === "string" && email.length > 0 ? email : null;
}
