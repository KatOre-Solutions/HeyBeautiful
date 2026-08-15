import { REDIRECT_KEY } from "@/lib/constants";

/**
 * The single place post-auth redirect destinations are validated, carried and stored.
 *
 * `from` values are attacker-controlled (query string, and — via any XSS — sessionStorage),
 * so this module is the *security boundary*: callers are never trusted to pre-validate.
 * `resolveDestination` is total and non-throwing, and `withFrom` re-validates internally,
 * so no unsafe value can reach `router.push` or be serialised into an auth URL.
 *
 * ## Destination precedence
 *
 *   Is `from` present on the URL?
 *     ├─ Yes → validate it
 *     │         ├─ valid   → use the validated destination
 *     │         └─ invalid → DEFAULT_DESTINATION  (never falls back to sessionStorage)
 *     └─ No  → read sessionStorage
 *               ├─ valid and within TTL → use it
 *               └─ invalid / expired / absent → DEFAULT_DESTINATION
 *
 * A present-but-invalid `from` deliberately short-circuits to `/account`. Letting it fall
 * through to storage would let `?from=https://evil.example` interact with stale client
 * state, which is exactly the surprise we don't want attacker input to be able to trigger.
 *
 * ## sessionStorage lifecycle (`REDIRECT_KEY`)
 *
 * - **Created** only by the social `handleSocial` paths, immediately before a provider call
 *   that may become a full-page `signInWithRedirect`. The plain email/password path never
 *   writes it — React state survives that flow, so there is nothing to recover.
 * - **Read** only via `readDestination()`, which re-validates and drops entries older than
 *   `DESTINATION_TTL_MS`. Consulted only when `from` is absent (see precedence above).
 * - **Consumed** by `clearDestination()` on the successful post-auth navigation.
 * - **Deleted** on consume, on social-auth failure, and on TTL expiry.
 *
 * The TTL plus clear-on-navigate is what stops an abandoned destination from hijacking an
 * unrelated login later in the same tab session.
 */

export const DEFAULT_DESTINATION = "/account";

/** How long a stored social-redirect destination stays usable. */
export const DESTINATION_TTL_MS = 10 * 60 * 1000;

/**
 * Base used only to parse candidate paths. `.invalid` is reserved by RFC 2606 and can
 * never resolve, so a value that parses back to this origin is provably same-origin.
 */
const PARSE_BASE = "http://x.invalid";

/** Routes that would bounce the user straight back into the auth flow. */
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/verify-email"];

/**
 * Destinations that a *verified* email is a hard prerequisite for.
 *
 * The single source of truth for that policy. `/checkout` enforces it on itself
 * (`CheckoutContent`), the post-auth navigation uses it to route unverified users through
 * /verify-email first, and the verify page uses it to decide whether a manual "continue"
 * would be a dead end. Previously the same rule was spelled out separately in each place.
 *
 * `/account` is deliberately absent: it stays reachable while unverified and shows an
 * advisory reminder instead. Adding it here would turn that reminder into a gate.
 */
const VERIFICATION_REQUIRED_ROUTES = ["/checkout"];

/**
 * True for any C0 control character or DEL. Browsers strip tabs and newlines from URLs
 * *after* our checks would run, so a tab in `/<tab>/evil.com` would otherwise leave us
 * approving what the browser then treats as `//evil.com`.
 */
function hasControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

/** `decodeURIComponent` throws on malformed percent-encoding (`%zz`, a trailing `%`). */
function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

/**
 * Rejects the forms that browsers normalise into an off-site jump. Applied to both the raw
 * input and the decoded path — a backslash or control character is dangerous either way.
 */
function hasEscapeForm(value: string): boolean {
  return value.startsWith("//") || value.includes("\\") || hasControlChar(value);
}

/**
 * Resolves a `from` value (query param or stored destination) to a safe internal path.
 *
 * Total and non-throwing: every input — malformed percent-encoding, arbitrary Unicode,
 * control characters, encoded backslashes, protocol-relative and external URLs — returns
 * either a validated same-origin path or `DEFAULT_DESTINATION`. Query strings and
 * fragments on an accepted path are preserved (e.g. `/checkout?coupon=X`).
 */
export function resolveDestination(from: string | null | undefined): string {
  if (typeof from !== "string") return DEFAULT_DESTINATION;

  const raw = from.trim();
  if (!raw) return DEFAULT_DESTINATION;

  // Legacy bare token. No producer emits this any more, but old links may carry it.
  if (raw === "checkout") return "/checkout";

  // The raw value additionally rejects *any* whitespace. A genuine URL percent-encodes
  // spaces, so a literal one means the value was hand-crafted. (Encoded whitespace inside
  // a path — `/store/a%20b` — stays legal; it can't act as a delimiter.)
  if (!raw.startsWith("/") || hasEscapeForm(raw) || /\s/.test(raw)) return DEFAULT_DESTINATION;

  // The WHATWG parser normalises backslashes to slashes and strips tabs/newlines, so an
  // origin check here catches anything that slipped past the literal checks above.
  let url: URL;
  try {
    url = new URL(raw, PARSE_BASE);
  } catch {
    return DEFAULT_DESTINATION;
  }
  if (url.origin !== PARSE_BASE) return DEFAULT_DESTINATION;

  // Re-check the decoded path: `/%5C%5Cevil.com` and `/%09//evil.com` are only dangerous
  // once decoded, and a decode failure means the value was malformed to begin with.
  const decoded = safeDecode(url.pathname);
  if (decoded === null || hasEscapeForm(decoded)) return DEFAULT_DESTINATION;

  // Sending the user back into the auth flow would loop them.
  const path = url.pathname;
  if (AUTH_ROUTES.some((route) => path === route || path.startsWith(`${route}/`)))
    return DEFAULT_DESTINATION;

  return url.pathname + url.search + url.hash;
}

/**
 * Builds an auth URL carrying a validated `?from=` destination.
 *
 * Validation happens *here* rather than at the call site, so an unsafe value can never be
 * serialised into the parameter: `withFrom("/signup", "https://evil.example")` yields
 * `/signup?from=%2Faccount`. Passing nothing returns `base` unchanged.
 */
export function withFrom(base: string, dest: string | null | undefined): string {
  if (dest === null || dest === undefined || dest === "") return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}from=${encodeURIComponent(resolveDestination(dest))}`;
}

/**
 * Marks a /login URL as "you were signed in a moment ago and no longer are", so the sign-in
 * page can say so instead of leaving the user to wonder why they were thrown out.
 */
export const SESSION_EXPIRED_PARAM = "session";

/**
 * The /login URL a protected page should send someone to when Firebase reports no user
 * despite the routing hint letting them in — an expired session, a revoked token, or a hint
 * that was never backed by one. The destination rides along so signing back in returns them
 * to where they were headed.
 */
export function sessionExpiredLoginUrl(dest: string | null | undefined): string {
  const base = withFrom("/login", dest);
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}${SESSION_EXPIRED_PARAM}=expired`;
}

/**
 * Whether reaching this destination requires a verified email. Accepts a full destination,
 * so the query string and hash are ignored (`/checkout?coupon=X` still counts).
 */
export function requiresVerification(destination: string): boolean {
  const path = resolveDestination(destination).split(/[?#]/)[0];
  return VERIFICATION_REQUIRED_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}

/**
 * Where to send someone the moment they finish authenticating.
 *
 * Normally straight to the destination they asked for. The exception is an unverified user
 * heading somewhere that requires verification: sending them to the destination would just
 * have that page bounce them to /verify-email, costing a history entry and a flash of a
 * loading screen. Routing them there directly is the same outcome without the detour, and
 * `from` keeps the original destination so verifying lands them where they meant to go.
 *
 * Destinations that don't require verification — `/account` above all — are unaffected:
 * an unverified user still reaches them and sees the advisory reminder.
 */
export function postAuthDestination(
  destination: string,
  emailVerified: boolean
): string {
  // Resolve on both branches. Callers happen to pass an already-resolved destination
  // today, but this returns a value that goes straight into router.push — it validates
  // its own input rather than trusting that, same as withFrom.
  const safe = resolveDestination(destination);
  return !emailVerified && requiresVerification(safe)
    ? withFrom("/verify-email", safe)
    : safe;
}

/**
 * Stores a destination across a full-page `signInWithRedirect`. Validated on the way in and
 * again on the way out, and stamped so `readDestination` can expire it.
 */
export function saveDestination(dest: string): void {
  if (typeof window === "undefined") return;
  try {
    const entry = JSON.stringify({ d: resolveDestination(dest), t: Date.now() });
    sessionStorage.setItem(REDIRECT_KEY, entry);
  } catch {
    // Storage disabled or full (e.g. Safari private mode) — the flow still works, the
    // user just lands on the default destination.
  }
}

/**
 * Reads the stored destination, or null when there is nothing usable. Non-destructive —
 * `clearDestination()` is what consumes it. A malformed, mis-shaped or expired entry is
 * treated as absent and cleared.
 */
export function readDestination(): string | null {
  if (typeof window === "undefined") return null;

  let stored: string | null;
  try {
    stored = sessionStorage.getItem(REDIRECT_KEY);
  } catch {
    return null;
  }
  if (!stored) return null;

  let entry: unknown;
  try {
    entry = JSON.parse(stored);
  } catch {
    clearDestination();
    return null;
  }

  if (typeof entry !== "object" || entry === null) {
    clearDestination();
    return null;
  }
  const { d, t } = entry as { d?: unknown; t?: unknown };
  if (typeof d !== "string" || typeof t !== "number" || !Number.isFinite(t)) {
    clearDestination();
    return null;
  }
  if (Date.now() - t > DESTINATION_TTL_MS) {
    clearDestination();
    return null;
  }

  return resolveDestination(d);
}

/** Consumes the stored destination. Safe to call when nothing is stored. */
export function clearDestination(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(REDIRECT_KEY);
  } catch {
    // Nothing to do — a destination we can't clear will expire on its own.
  }
}
