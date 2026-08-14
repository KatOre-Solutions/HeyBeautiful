"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AuthTransitionProvider, type AuthMode } from "./AuthTransitionContext";
import { BLADE_X, CONTENT_X, getBladeContent, useBladeTransition } from "./useBladeTransition";
import AuthBlade from "./AuthBlade";

/**
 * Persistent shell for /login and /signup.
 *
 * It's mounted from the `(card)` route group's layout, and App Router does not
 * remount a shared layout when navigating between sibling routes — which is the
 * whole trick: the blade element survives the /login ↔ /signup navigation, so it
 * can keep animating straight through the route change instead of being torn
 * down and rebuilt mid-sweep.
 */
export default function AuthCard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const mode: AuthMode = pathname?.startsWith("/signup") ? "signup" : "signin";

  const bladeRef = useRef<HTMLDivElement>(null);
  const [lastLoginFrom, setLastLoginFrom] = useState<string | null>(null);

  const { requestSwitch, isTransitioning, notifyPaneReady } = useBladeTransition({
    bladeRef,
    mode,
  });

  // Park the blade for the current mode before first paint, so a direct load of
  // either route never flashes it mid-sweep. Runs on every settled render rather
  // than only on mode change: these transforms are applied imperatively, so if
  // React ever recreates the nodes they'd otherwise come back untransformed.
  // Mid-transition the hook owns them, hence the guard.
  useLayoutEffect(() => {
    if (isTransitioning) return;
    const blade = bladeRef.current;
    const content = getBladeContent(blade);
    if (blade) blade.style.transform = `translateX(${BLADE_X[mode]})`;
    if (content) content.style.transform = `translateX(${CONTENT_X[mode]})`;
  });

  // Imperative navigation gets no automatic <Link> prefetch, so warm both routes.
  useEffect(() => {
    router.prefetch("/login");
    router.prefetch("/signup");
  }, [router]);

  return (
    <AuthTransitionProvider
      value={{ requestSwitch, isTransitioning, notifyPaneReady, lastLoginFrom, setLastLoginFrom }}
    >
      <section
        className="relative w-[min(1200px,94vw)] min-h-[720px] rounded-[28px] overflow-hidden bg-off-white"
        style={{ boxShadow: "0 30px 80px rgba(30,24,20,0.16)" }}
      >
        {/* Form slot. Mirrors sides with the blade so the swap reads as a genuine
            left/right flip rather than a curtain wiping over a fixed layout. */}
        <div
          className={cn(
            "absolute inset-0 flex items-center px-8 sm:px-12 lg:px-16 py-16",
            mode === "signin" ? "lg:justify-end" : "lg:justify-start",
            isTransitioning && "pointer-events-none"
          )}
        >
          <div className="w-full max-w-sm lg:w-[42%] lg:max-w-none mx-auto lg:mx-0">{children}</div>
        </div>

        <AuthBlade ref={bladeRef} mode={mode} />

        {/* Sits above the blade rather than inside it: anchored in the blade the
            diagonal clips it away in signup, where the panel's top-left corner is
            the cut one. Colour follows whichever surface is under it. */}
        <Link
          href="/"
          className={cn(
            "absolute top-8 left-8 lg:top-10 lg:left-10 z-30 label-caps transition-colors",
            mode === "signin"
              ? "text-off-white/80 hover:text-off-white"
              : "text-ink/50 hover:text-dusty-pink"
          )}
        >
          ← Back to shop
        </Link>
      </section>
    </AuthTransitionProvider>
  );
}
