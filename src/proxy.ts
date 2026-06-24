import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants";

// Routes that require a session.
const PROTECTED = ["/account", "/checkout"];
// TODO(#22): email verification is advisory — protected routes don't enforce emailVerified.
// Routes a signed-in user shouldn't see (verify-email is intentionally excluded —
// authenticated-but-unverified users still need it).
const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];

export function proxy(request: NextRequest) {
  const hasAuth = Boolean(request.cookies.get(AUTH_COOKIE));
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  // Gate protected routes behind a session.
  if (isProtected && !hasAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Keep signed-in users out of the auth screens.
  if (isAuthPage && hasAuth) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/checkout/:path*",
    "/login",
    "/signup",
    "/forgot-password",
  ],
};
