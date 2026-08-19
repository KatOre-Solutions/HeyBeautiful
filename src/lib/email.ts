/**
 * Trim surrounding whitespace and lowercase the address.
 *
 * Firebase stores addresses lowercased, so `A@X.com` and `a@x.com` are already the same
 * account to it. Normalising on our side keeps every flow — sign in, sign up, password
 * reset — agreeing with that, and stops a stray capital or a copy-paste space reading as a
 * different user.
 *
 * Deliberately nothing cleverer. No dot-stripping, no plus-tag removal: those are
 * provider-specific conventions, and collapsing `a+shop@gmail.com` into `a@gmail.com` would
 * merge addresses the user considers distinct.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * A deliberately loose shape check — something before the @, something after, and a dot in
 * the domain. Enough to catch a typo before spending a network round trip on it; the real
 * arbiter is Firebase (and ultimately whether the verification email arrives).
 */
export function isPlausibleEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}
