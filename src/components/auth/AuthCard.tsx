"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AuthTransitionProvider, type AuthMode } from "./AuthTransitionContext";
import { useBladeTransition } from "./useBladeTransition";
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
   * There is deliberately no parking code here. The blade's resting position is
   * owned by `.auth-blade` in globals.css, keyed off `data-mode` and the `lg`
   * media query. That means it is already correct on the server-rendered paint
   * — an inline transform set from an effect lands after hydration, and until
   * then the blade sat untransformed on top of the form — and it re-resolves by
   * itself whenever the card changes height, since the percentage is relative to
   * the blade's own box. The transition writes inline transforms while it runs
   * and clears them when it settles.
   */

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
        className="relative w-full rounded-2xl overflow-hidden bg-off-white lg:w-[min(1200px,94vw)] lg:rounded-[28px]"
        style={{ boxShadow: "0 30px 80px rgba(30,24,20,0.16)" }}
      >
        {/* Form slot — in normal flow at every breakpoint, so the card always
            grows with the form instead of clipping it.
            As an absolute child it contributed no height, and the card's fixed
            720px was only ~30px clear of the signup form: adding the password
            strength meter and three inline validation errors pushed it to 766px,
            which `overflow-hidden` then cut at both ends — taking the heading off
            the top and the "Already a member?" toggle off the bottom, exactly
            when a user had made a mistake.
            Mobile stacks under the band (top padding clears BAND_H). Desktop
            keeps the mirrored composition by padding the side the blade rests
            on, and `lg:min-h-[720px]` lives here rather than on the card so the
            slot can both hold the floor and grow past it. */}
        <div
          className={cn(
            "relative px-6 pb-12 pt-[272px] sm:px-8",
            "lg:flex lg:items-center lg:min-h-[720px] lg:py-16 lg:pt-16",
            mode === "signin" ? "lg:pl-[54%] lg:pr-16" : "lg:pr-[54%] lg:pl-16",
            isTransitioning && "pointer-events-none"
          )}
        >
          <div className="w-full max-w-sm mx-auto lg:mx-0">{children}</div>
        </div>

        <AuthBlade ref={bladeRef} mode={mode} />

        {/* Sits above the blade rather than inside it: anchored in the blade the
            diagonal clips it away in signup, where the panel's top-left corner is
            the cut one.
            On mobile the band is always at the top, so this is always over rose
            gold; only on desktop does it depend which side the blade rests.
            The ink variant is suppressed while a transition runs: `mode` flips at
            the route swap, mid-cover, but this link paints above the blade — so
            switching colour on `mode` alone put dark ink on top of the rose-gold
            panel for the whole reveal. Staying light until the blade has settled
            matches what is actually underneath it. */}
        <Link
          href="/"
          className={cn(
            "absolute top-6 left-6 lg:top-10 lg:left-10 z-30 label-caps transition-colors",
            "text-off-white/80 hover:text-off-white",
            mode === "signup" &&
              !isTransitioning &&
              "lg:text-ink/60 lg:hover:text-rose-dark"
          )}
        >
          ← Back to shop
        </Link>
      </section>
    </AuthTransitionProvider>
  );
}
