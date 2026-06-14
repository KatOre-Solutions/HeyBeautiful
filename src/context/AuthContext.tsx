"use client";

import {
  createContext,
  useContext,
  useEffect,
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
  type User,
  type AuthProvider as FirebaseAuthProvider,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth, googleProvider, appleProvider } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerification: () => Promise<void>;
}

const AUTH_COOKIE = "hb-auth-token";

/** Lightweight presence flag read by the proxy. Not a credential. */
function setAuthCookie() {
  if (typeof document === "undefined") return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=2592000; SameSite=Lax${secure}`;
}

function clearAuthCookie() {
  if (typeof document === "undefined") return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax${secure}`;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Complete any pending signInWithRedirect (the popup-blocked / mobile fallback).
    // Without this the redirect-based OAuth flow is never deterministically finished
    // and its errors are swallowed. onAuthStateChanged still fires for the success
    // case, but this surfaces redirect-stage failures.
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) setAuthCookie();
      })
      .catch((err) => {
        console.error("Social sign-in (redirect) failed:", err);
      });

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setAuthCookie();
      else clearAuthCookie();
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, remember = true) => {
      // "Remember me" controls whether the Firebase session survives a browser
      // restart. The presence cookie is reconciled by onAuthStateChanged on load.
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );
      await signInWithEmailAndPassword(auth, email, password);
      setAuthCookie();
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // The account now exists — set the session flag before anything that can
      // fail, so a verification-send hiccup (e.g. rate limit) doesn't strand a
      // created account with no session and a "email already in use" on retry.
      setAuthCookie();
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      try {
        await sendEmailVerification(cred.user);
      } catch (err) {
        // Non-fatal: the user can resend from /verify-email.
        console.error("Failed to send verification email:", err);
      }
    },
    []
  );

  const socialSignIn = useCallback(async (provider: FirebaseAuthProvider) => {
    try {
      await signInWithPopup(auth, provider);
      setAuthCookie();
    } catch (err) {
      // On mobile / strict browsers the popup is often blocked — fall back to redirect.
      if (
        err instanceof FirebaseError &&
        (err.code === "auth/popup-blocked" ||
          err.code === "auth/operation-not-supported-in-this-environment")
      ) {
        await signInWithRedirect(auth, provider);
        return;
      }
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
    await fbSignOut(auth);
    clearAuthCookie();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const sendVerification = useCallback(async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
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
      signUp: async () => {},
      signOut: async () => {},
      signInWithGoogle: async () => {},
      signInWithApple: async () => {},
      resetPassword: async () => {},
      sendVerification: async () => {},
    } satisfies AuthContextType;
  }
  return ctx;
}
