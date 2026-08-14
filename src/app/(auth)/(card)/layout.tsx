import type { ReactNode } from "react";
import AuthCard from "@/components/auth/AuthCard";

/**
 * Wraps only /login and /signup. Because App Router keeps a shared layout mounted
 * across sibling navigations, AuthCard — and the blade inside it — persists while
 * `children` swaps between the two forms.
 */
export default function AuthCardLayout({ children }: { children: ReactNode }) {
  return <AuthCard>{children}</AuthCard>;
}
