"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  getAdditionalUserInfo,
  type User,
  type UserCredential,
  type AuthProvider as FirebaseAuthProvider,
} from "firebase/auth";
import { auth, googleProvider, appleProvider } from "@/lib/firebase";
import { isPopupFallbackError, isUserNotFoundError } from "@/lib/auth-errors";
import { normalizeEmail } from "@/lib/email";
import { readProviderName } from "@/lib/provider-profile";
import {
  clearLocalUserState,
  clearSessionHint,
  markSessionOnly,
  setSessionHint,
} from "@/lib/session";

/**
 * What happened *after* the account was created.
 *
 * `signUp` only rejects when the account could not be created at all. Once Firebase has the
 * account, every later step is best-effort and reported here instead of thrown — telling
 * someone "sign-up failed" when their account exists sends them back to try again, straight
 * into `auth/email-already-in-use`, with no idea they already have an account.
 */
export interface SignUpResult {
  /** False when the verification email couldn't be sent. The user can resend. */
  verificationEmailSent: boolean;
  /** False when the display name couldn't be saved. Cosmetic; the account is fine. */
  displayNameSet: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerification: () => Promise<void>;
  /** Reloads the Firebase user and returns the fresh `emailVerified`. Resilient:
   *  returns false (never throws) on failure, and coalesces concurrent calls. */
  reloadUser: () => Promise<boolean>;
  /**
   * Error from a completed `signInWithRedirect` round trip. The redirect fallback lands the
   * user back on the auth page with the failure already in the past, so it's held here for
   * the page to render once and then clear.
   */
  redirectError: unknown;
  clearRedirectError: () => void;
}

/**
 * Persists the name a provider gave us, at the one moment it is available.
 *
 * This exists for Apple. Apple releases the user's real name **only on the very first
 * authorization** — every subsequent sign-in omits it, and the only way to make it reappear
 * is for the user to revoke the app under Settings → Apple ID → Sign in with Apple. Firebase
 * surfaces it on the returned credential but does not reliably write it to the account
 * record, so if we don't capture it here the name is gone for good and the account shows
 * "Beautiful" forever.
 *
 * Scoped to new users because that is exactly when the name arrives; a returning Apple user
 * carries nothing to capture. Failure is cosmetic and never blocks sign-in.
 */
async function captureProviderDisplayName(result: UserCredential): Promise<void> {
  const info = getAdditionalUserInfo(result);
  if (!info?.isNewUser) return;

  const name = readProviderName(info.profile, result.user.displayName);
  if (!name) return;

  try {
    await updateProfile(result.user, { displayName: name });
  } catch (err) {
    console.error("Failed to persist provider display name:", err);
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Bumped after a successful reload so consumers re-render and read the
  // freshly-mutated `user.emailVerified` (reload() mutates currentUser in place
  // and does not fire onAuthStateChanged).
  const [, setTick] = useState(0);
  const [redirectError, setRedirectError] = useState<unknown>(null);
  // Holds the active reload so overlapping callers (poll + tab-focus) share one
  // in-flight request instead of firing concurrent reload()s.
  const reloadInFlight = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    // Complete any pending signInWithRedirect (the popup-blocked / mobile fallback).
    // Without this the redirect-based OAuth flow is never deterministically finished
    // and its errors are swallowed. onAuthStateChanged still fires for the success
    // case, but this surfaces redirect-stage failures.
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result?.user) return;
        setSessionHint();
        await captureProviderDisplayName(result);
      })
      .catch((err) => {
        // Hand it to the UI as well as the console. The redirect fallback returns the user
        // to the auth page with no idea anything went wrong; a silent failure here reads as
        // "the button did nothing", which is how the popup-blocked path used to feel.
        console.error("Social sign-in (redirect) failed:", err);
        setRedirectError(err);
      });

    // Firebase auth state is the authority; the hint cookie is reconciled to it on every
    // transition. A hint that outlives its session (expiry, revoked refresh token, a value
    // set by hand) is cleared here the moment Firebase reports no user.
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setSessionHint();
      else clearSessionHint();
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, remember = true) => {
      // "Remember me" controls whether the Firebase session survives a browser restart.
      // Record the choice *before* signing in so the hint cookie written below (and on any
      // later reload) is given the matching lifetime instead of a blanket 30 days.
      markSessionOnly(!remember);
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );
      await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
      setSessionHint();
    },
    []
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName: string
    ): Promise<SignUpResult> => {
      // The only critical step. If this rejects, no account exists and the caller should
      // show the error and let the user fix it.
      const cred = await createUserWithEmailAndPassword(
        auth,
        normalizeEmail(email),
        password
      );

      // --- Past this line the account EXISTS. Nothing below may reject. ---
      // Set the session flag first, so a later hiccup can't strand a created account with
      // no session and an "email already in use" on retry.
      setSessionHint();

      let displayNameSet = true;
      if (displayName) {
        try {
          await updateProfile(cred.user, { displayName });
        } catch (err) {
          // Cosmetic. Previously this was unguarded, so a failure here rejected signUp and
          // told the user their sign-up had failed when the account was already created.
          displayNameSet = false;
          console.error("Failed to set display name:", err);
        }
      }

      let verificationEmailSent = true;
      try {
        await sendEmailVerification(cred.user);
      } catch (err) {
        // Recoverable: the user can resend from /verify-email, which says so when told.
        verificationEmailSent = false;
        console.error("Failed to send verification email:", err);
      }

      return { displayNameSet, verificationEmailSent };
    },
    []
  );

  const socialSignIn = useCallback(async (provider: FirebaseAuthProvider) => {
    // State the intent instead of inheriting it. There's no "remember me" on the social
    // buttons, so these logins are persistent — but without saying so we'd keep whatever
    // persistence a previous signIn left on the Auth instance, while signOut has already
    // cleared the session-only marker. That pairs a session-scoped Firebase login with a
    // 30-day hint cookie, and the next browser launch bounces off /account as "expired".
    markSessionOnly(false);
    await setPersistence(auth, browserLocalPersistence);
    try {
      const result = await signInWithPopup(auth, provider);
      setSessionHint();
      await captureProviderDisplayName(result);
    } catch (err) {
      // On mobile / strict browsers the popup is often blocked — fall back to redirect.
      // Cancellations (auth/popup-closed-by-user, auth/cancelled-popup-request) deliberately
      // fall through to the throw: the user chose to stop, and bouncing them into a
      // full-page redirect instead would ignore that.
      if (isPopupFallbackError(err)) {
        await signInWithRedirect(auth, provider);
        return;
      }
      //
      // FUTURE — account linking (deliberately not built here):
      // On auth/account-exists-with-different-credential the pending credential is still
      // recoverable at this point via `OAuthProvider.credentialFromError(err)` (Apple) or
      // `GoogleAuthProvider.credentialFromError(err)` (Google). A linking flow would hold
      // it, sign the user in with their existing method, then call
      // `linkWithCredential(auth.currentUser, pending)`. We don't retain it today on
      // purpose: an unused OAuth credential parked in memory or storage is a liability, and
      // linking needs a reauthentication story (see Phase 10) before it's safe to ship.
      // Nothing here forecloses it — the error reaches the caller intact.
      throw err;
    }
  }, []);

  const signInWithGoogle = useCallback(
    () => socialSignIn(googleProvider),
    [socialSignIn]
  );

  const signInWithApple = useCallback(
    () => socialSignIn(appleProvider),
    [socialSignIn]
  );

  const signOut = useCallback(async () => {
    try {
      await fbSignOut(auth);
    } finally {
      // Clear the local traces even if the Firebase call failed (offline, transient
      // error). The user asked to leave — leaving a live hint and a populated bag behind
      // on their device would be the worse outcome, and onAuthStateChanged reconciles the
      // rest once connectivity returns.
      //
      // NOTE: this clears cart/wishlist *storage*. The in-memory contexts live below
      // AuthProvider, so their call sites reset those (AccountContent, VerifyEmailContent).
      clearLocalUserState();
    }
  }, []);

  /**
   * Sends a password reset link.
   *
   * Resolves normally when the address has no account. Letting `auth/user-not-found` reach
   * the UI would turn this form into a membership oracle: type an address, learn from the
   * error whether that person shops here. Swallowing it *here* rather than in the component
   * means no future caller can reintroduce the leak by handling the error differently.
   *
   * Firebase's own email-enumeration protection already collapses this case when enabled,
   * but it's a project setting we don't control from the code, so we don't rely on it.
   * Everything else — network failure, rate limiting — still rejects and is worth telling
   * the user about, because none of it depends on whether the account exists.
   */
  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, normalizeEmail(email));
    } catch (err) {
      if (isUserNotFoundError(err)) return;
      throw err;
    }
  }, []);

  const sendVerification = useCallback(async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  }, []);

  const clearRedirectError = useCallback(() => setRedirectError(null), []);

  const reloadUser = useCallback(async () => {
    if (reloadInFlight.current) return reloadInFlight.current;

    const run = (async () => {
      if (!auth.currentUser) return false;
      try {
        await auth.currentUser.reload();
      } catch (err) {
        // Transient network / expired-session failures shouldn't break the
        // polling loop — treat as "still unverified" and let the next tick retry.
        console.error("User reload failed:", err);
        return false;
      }
      // Force consumers to re-read the mutated currentUser.
      setTick((t) => t + 1);
      // Optional-chain in case a concurrent sign-out cleared currentUser during
      // the await — honour the "never throws" contract.
      return auth.currentUser?.emailVerified ?? false;
    })();

    reloadInFlight.current = run;
    try {
      return await run;
    } finally {
      reloadInFlight.current = null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        signInWithApple,
        resetPassword,
        sendVerification,
        reloadUser,
        redirectError,
        clearRedirectError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      loading: true,
      signIn: async (_email: string, _password: string, _remember?: boolean) => {},
      signUp: async () => ({ verificationEmailSent: false, displayNameSet: false }),
      signOut: async () => {},
      signInWithGoogle: async () => {},
      signInWithApple: async () => {},
      resetPassword: async () => {},
      sendVerification: async () => {},
      reloadUser: async () => false,
      redirectError: null,
      clearRedirectError: () => {},
    } satisfies AuthContextType;
  }
  return ctx;
}
