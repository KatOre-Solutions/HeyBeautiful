import type { ReactNode } from "react";

/**
 * Centring wrapper for every auth screen. /login and /signup nest a further
 * layout inside the `(card)` group which supplies the animated card chrome;
 * /forgot-password and /verify-email render straight into this.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-off-white py-8 px-4 sm:py-12 sm:px-6 lg:py-16">
      {children}
    </div>
  );
}
