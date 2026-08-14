"use client";

import { createContext, useContext } from "react";

export type AuthMode = "signin" | "signup";

export interface AuthTransitionValue {
  /** Plays the blade sweep, swaps the route mid-cover, then reveals `nextMode`. */
  requestSwitch: (nextMode: AuthMode, href: string) => void;
  /** True while a sweep is in flight — panes disable interaction for the duration. */
  isTransitioning: boolean;
  /**
   * Called by a pane once it has mounted *and painted*. The blade waits on this
   * before revealing, so the incoming form is never uncovered before it exists.
   */
  notifyPaneReady: (mode: AuthMode) => void;
  /**
   * Last `?from=` seen on /login, so a /login → /signup → /login bounce can carry
   * the post-auth destination back. Survives the round trip because AuthCard,
   * which owns this state, never remounts between the two routes.
   */
  lastLoginFrom: string | null;
  setLastLoginFrom: (from: string | null) => void;
}

const AuthTransitionContext = createContext<AuthTransitionValue | null>(null);

export const AuthTransitionProvider = AuthTransitionContext.Provider;

export function useAuthTransition(): AuthTransitionValue {
  const value = useContext(AuthTransitionContext);
  if (!value) {
    throw new Error("useAuthTransition must be used within AuthCard");
  }
  return value;
}
