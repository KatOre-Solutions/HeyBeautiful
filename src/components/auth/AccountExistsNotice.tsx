"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

interface AccountExistsNoticeProps {
  /** What happened, in the user's terms. */
  children: ReactNode;
  /** Omit on the sign-in pane — the form is already right there. */
  signInHref?: string;
  resetHref: string;
  /** Lets /login and /signup intercept the sign-in link to play the blade transition. */
  onSignIn?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * "You already have an account" — shown inline rather than as a toast.
 *
 * Both cases that reach it (signing up with a taken address, and an OAuth provider clashing
 * with an existing account) are the same situation from the user's side: they are already a
 * customer and need a route in, not a red error that disappears after five seconds. The
 * hrefs come from the caller so the post-auth destination survives the detour.
 */
export default function AccountExistsNotice({
  children,
  signInHref,
  resetHref,
  onSignIn,
}: AccountExistsNoticeProps) {
  return (
    <div
      role="status"
      className="mt-2 px-3 py-2.5 rounded-xl"
      style={{
        background: "rgba(201,151,122,0.08)",
        border: "1px solid rgba(201,151,122,0.25)",
      }}
    >
      <p
        className="text-ink/70 mb-1.5 leading-relaxed"
        style={{ fontFamily: "var(--font-manrope)", fontSize: "0.78rem" }}
      >
        {children}
      </p>
      <div className="flex items-center gap-3">
        {signInHref && (
          <>
            <Link
              href={signInHref}
              onClick={onSignIn}
              className="text-rose-dark font-medium hover:opacity-70 transition-opacity"
              style={{ fontFamily: "var(--font-manrope)", fontSize: "0.78rem" }}
            >
              Sign in instead
            </Link>
            <span className="text-ink/25" aria-hidden="true">
              ·
            </span>
          </>
        )}
        <Link
          href={resetHref}
          className="text-rose-dark font-medium hover:opacity-70 transition-opacity"
          style={{ fontFamily: "var(--font-manrope)", fontSize: "0.78rem" }}
        >
          Reset your password
        </Link>
      </div>
    </div>
  );
}
