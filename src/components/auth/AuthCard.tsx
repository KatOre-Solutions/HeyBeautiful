"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AuthTransitionProvider, type AuthMode } from "./AuthTransitionContext";
import {
  BLADE_X,
  CONTENT_X,
  getBladeContent,
  mobileTargets,
  useBladeTransition,
} from "./useBladeTransition";
import { useIsDesktop } from "./useIsDesktop";
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

  const cardRef = useRef<HTMLElement>(null);
  const bladeRef = useRef<HTMLDivElement>(null);
  const [lastLoginFrom, setLastLoginFrom] = useState<string | null>(null);
  const isDesktop = useIsDesktop();

  const { requestSwitch, isTransitioning, notifyPaneReady } = useBladeTransition({
    bladeRef,
    cardRef,
    isDesktop,
    mode,
  });

  /**
   * Parks the blade at rest for the current mode and viewport. The transform is
   * written whole (never a single axis) so switching breakpoints can't leave a
   * stale translate on the other axis.
   */
  const park = useCallback(() => {
    const blade = bladeRef.current;
    const content = getBladeContent(blade);
    if (!blade || !content) return;

    if (isDesktop) {
      blade.style.transform = `translateX(${BLADE_X[mode]})`;
      content.style.transform = `translateX(${CONTENT_X[mode]})`;
      return;
    }

    const cardHeight = cardRef.current?.getBoundingClientRect().height ?? 0;
    const t = mobileTargets(cardHeight);
    blade.style.transform = `translateY(${t.blade.rest})`;
    content.style.transform = `translateY(${t.content.rest})`;
  }, [isDesktop, mode]);

  // Park before first paint, so a direct load of either route never flashes the
  // blade mid-sweep. Runs on every settled render rather than only on mode change:
  // these transforms are applied imperatively, so if React ever recreates the
  // nodes they'd otherwise come back untransformed. Mid-transition the hook owns
  // them, hence the guard.
  useLayoutEffect(() => {
    if (isTransitioning) return;
    park();
  });

  /**
   * Mobile rest depends on the card's measured height, which can change without
   * a React render — image decode, font swap, rotation, an inline field error
   * appearing. Without this the band drifts away from the top of the card.
   */
  useEffect(() => {
    const card = cardRef.current;
    if (!card || isDesktop) return;
    const observer = new ResizeObserver(() => {
      if (isTransitioning) return;
      park();
    });
    observer.observe(card);
    return () => observer.disconnect();
  }, [isDesktop, isTransitioning, park]);

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
        ref={cardRef}
        className="relative w-full rounded-2xl overflow-hidden bg-off-white lg:w-[min(1200px,94vw)] lg:min-h-[720px] lg:rounded-[28px]"
        style={{ boxShadow: "0 30px 80px rgba(30,24,20,0.16)" }}
      >
        {/* Form slot.
            Mobile: in normal flow beneath the band, so the card grows with the
            form — as an absolute child it contributed no height and a tall signup
            form was clipped by `overflow-hidden` rather than scrolling.
            Desktop: absolute, and mirrors sides with the blade so the swap reads
            as a genuine left/right flip rather than a curtain over a fixed layout.
            Top padding clears the band (BAND_H + breathing room). */}
        <div
          className={cn(
            "relative px-6 pb-12 pt-[272px] sm:px-8",
            "lg:absolute lg:inset-0 lg:flex lg:items-center lg:px-16 lg:py-16",
            mode === "signin" ? "lg:justify-end" : "lg:justify-start",
            isTransitioning && "pointer-events-none"
          )}
        >
          <div className="w-full max-w-sm mx-auto lg:w-[42%] lg:max-w-none lg:mx-0">{children}</div>
        </div>

        <AuthBlade ref={bladeRef} mode={mode} />

        {/* Sits above the blade rather than inside it: anchored in the blade the
            diagonal clips it away in signup, where the panel's top-left corner is
            the cut one.
            On mobile the band is always at the top, so this is always over rose
            gold; only on desktop does it depend which side the blade rests. */}
        <Link
          href="/"
          className={cn(
            "absolute top-6 left-6 lg:top-10 lg:left-10 z-30 label-caps transition-colors",
            "text-off-white/80 hover:text-off-white",
            mode === "signup" && "lg:text-ink/50 lg:hover:text-dusty-pink"
          )}
        >
          ← Back to shop
        </Link>
      </section>
    </AuthTransitionProvider>
  );
}
