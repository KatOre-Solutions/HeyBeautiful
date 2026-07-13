/**
 * Resolves a post-auth redirect target from a `from` value (query param or saved
 * destination). Shared by the login and verify-email flows so the open-redirect
 * guard lives in one place.
 *
 * Accepts the legacy `"checkout"` token and same-origin absolute paths (which may
 * carry a query string, e.g. `/checkout?coupon=X`). Rejects protocol-relative
 * (`//evil.com`) and backslash (`/\`) forms, and anything else, falling back to
 * `/account`.
 */
export function resolveDestination(from: string | null): string {
  if (!from) return "/account";
  if (from === "checkout") return "/checkout";
  // Only allow same-origin absolute paths. Reject protocol-relative ("//evil.com")
  // and any other value to avoid an open redirect.
  if (from.startsWith("/") && !from.startsWith("//") && !from.startsWith("/\\")) return from;
  return "/account";
}
