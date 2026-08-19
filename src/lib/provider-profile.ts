/**
 * Reads a display name out of whatever shape an OAuth provider returned.
 *
 * The providers disagree. Google puts a flat `name` on the profile claims (plus
 * `given_name` / `family_name`); Apple sends a nested `{ firstName, lastName }` object. The
 * `fallback` is `result.user.displayName`, which the Firebase SDK sometimes populates for
 * the session without writing it to the account record.
 *
 * Everything is defensive: these are third-party payloads whose shape we don't control, so
 * a surprising type returns null rather than throwing into the sign-in path.
 */
export function readProviderName(
  profile: unknown,
  fallback?: string | null
): string | null {
  if (typeof fallback === "string" && fallback.trim()) return fallback.trim();
  if (!profile || typeof profile !== "object") return null;

  const claims = profile as Record<string, unknown>;

  // Google: a ready-made full name.
  if (typeof claims.name === "string" && claims.name.trim()) {
    return claims.name.trim();
  }

  // Apple: { name: { firstName, lastName } }.
  if (claims.name && typeof claims.name === "object") {
    const { firstName, lastName } = claims.name as Record<string, unknown>;
    const parts = [firstName, lastName].filter(
      (part): part is string => typeof part === "string" && part.trim().length > 0
    );
    if (parts.length) return parts.map((part) => part.trim()).join(" ");
  }

  // Google's split claims, when `name` is absent.
  const given = typeof claims.given_name === "string" ? claims.given_name.trim() : "";
  const family = typeof claims.family_name === "string" ? claims.family_name.trim() : "";
  const combined = `${given} ${family}`.trim();
  return combined || null;
}
