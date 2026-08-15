import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LEGACY_SESSION_HINT_COOKIE, SESSION_HINT_COOKIE } from "@/lib/constants";
import { resolveDestination } from "@/lib/redirect";

// Routes that require a session.
const PROTECTED = ["/account", "/checkout"];
// #22: /checkout additionally requires a verified email, but that's enforced
// client-side in CheckoutContent — the edge proxy only sees the presence cookie
// and can't read Firebase's emailVerified. /account stays advisory (soft reminder).
// Routes a signed-in user shouldn't see (verify-email is intentionally excluded —
// authenticated-but-unverified users still need it).
const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];

/**
 * #46: per-request Content-Security-Policy with a nonce.
 *
 * Shipped **Report-Only** for now — it reports violations but blocks nothing, so
 * it can't break auth or animations while the directives are tuned from real
 * reports before a future flip to enforcing. HomeHero's inline loader script (and
 * the <style> it injects) read the nonce so the no-flash behavior survives that flip.
 *
 * `style-src` deliberately stays on 'unsafe-inline' with no nonce token: Framer
 * Motion, React style={{}}, next/font and optimizeCss all emit inline styles, and
 * per spec a nonce in a directive makes browsers ignore 'unsafe-inline'.
 */
function buildCsp(nonce: string): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://apis.google.com https://accounts.google.com https://www.gstatic.com`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://cdn.shopify.com https://*.googleusercontent.com`,
    `font-src 'self' data:`,
    `connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com`,
    `frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://appleid.apple.com`,
    `media-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ].join("; ");
}

export function proxy(request: NextRequest) {
  // A *hint*, never proof. It says "a session may exist", which is enough to decide which
  // page to render without a Firebase round trip at the edge. Every protected page
  // re-checks the real Firebase session on the client and bounces if the hint was lying.
  // The legacy name is still read so browsers holding a pre-rename cookie don't get an
  // extra redirect; it can be dropped once those have expired.
  const hasSessionHint = Boolean(
    request.cookies.get(SESSION_HINT_COOKIE) ??
      request.cookies.get(LEGACY_SESSION_HINT_COOKIE)
  );
  const { pathname } = request.nextUrl;

  const nonce = crypto.randomUUID();
  const csp = buildCsp(nonce);

  // Forward the nonce + policy to the render via request headers: Next reads the
  // (request-only) `content-security-policy` header to auto-nonce its own bootstrap
  // scripts, and `page.tsx` reads `x-nonce` to nonce HomeHero's inline script.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  // Every branch returns through here so the browser-facing Report-Only header
  // rides along on redirects as well as normal responses.
  const withCsp = (response: NextResponse) => {
    response.headers.set("content-security-policy-report-only", csp);
    return response;
  };

  // Gate protected routes behind a session.
  if (isProtected && !hasSessionHint) {
    // A fresh URL rather than a clone of nextUrl: cloning drags the protected page's own
    // query params onto the login screen. `from` carries path *and* search so
    // /checkout?coupon=X round-trips; resolveDestination validates it (same guard the
    // client uses) and searchParams does the encoding.
    const url = new URL("/login", request.url);
    url.searchParams.set(
      "from",
      resolveDestination(pathname + request.nextUrl.search)
    );
    return withCsp(NextResponse.redirect(url));
  }

  // Keep signed-in users out of the auth screens — but never when the URL carries `from`.
  //
  // `from` means something deliberately routed the visitor here, which includes a client
  // guard that just found the hint was lying. If we bounced those back, a hint the client
  // cannot clear (one scoped to another path, or a browser refusing the write) would ping
  // the user between /account and /login forever. Honouring `from` breaks that loop, and
  // costs nothing for a genuinely signed-in visitor: LoginContent sees `user` immediately
  // and forwards them to the destination they asked for.
  if (isAuthPage && hasSessionHint && !request.nextUrl.searchParams.has("from")) {
    return withCsp(NextResponse.redirect(new URL("/account", request.url)));
  }

  return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  // Run on every page so the CSP is site-wide, excluding API routes and static
  // assets (anything with a file extension, _next internals, favicon).
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
    },
  ],
};
