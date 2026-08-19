"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SignInPane from "@/components/auth/SignInPane";
import { useAuthTransition } from "@/components/auth/AuthTransitionContext";
import AuthErrorToast from "@/components/auth/AuthErrorToast";
import {
  getAuthErrorMessage,
  getConflictEmail,
  isCredentialConflictError,
} from "@/lib/auth-errors";
import {
  DEFAULT_DESTINATION,
  SESSION_EXPIRED_PARAM,
  clearDestination,
  postAuthDestination,
  readDestination,
  resolveDestination,
  saveDestination,
} from "@/lib/redirect";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setLastLoginFrom } = useAuthTransition();
  const fromParam = params.get("from");
  // A protected page found the session gone and sent them here. Say so, rather than leaving
  // them to wonder why they're suddenly looking at a sign-in form.
  const sessionExpired = params.get(SESSION_EXPIRED_PARAM) === "expired";
  // Precedence (documented in src/lib/redirect.ts): a `from` on the URL always decides,
  // *including* when it is invalid — falling through to the stored value would let a
  // hostile `?from=` interact with stale client state. Storage is consulted only when no
  // `from` was supplied at all, which is the social-redirect return.
  const destination = useMemo(
    () =>
      fromParam !== null
        ? resolveDestination(fromParam)
        : readDestination() ?? DEFAULT_DESTINATION,
    [fromParam]
  );
  const {
    signIn,
    signInWithGoogle,
    signInWithApple,
    user,
    loading: authLoading,
    redirectError,
    clearRedirectError,
  } = useAuth();

  // Stash the resolved destination on the card so a /login → /signup → /login bounce keeps
  // it; AuthCard outlives both routes, so the value survives the swap.
  useEffect(() => {
    if (destination !== DEFAULT_DESTINATION) setLastLoginFrom(destination);
  }, [destination, setLastLoginFrom]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Conflicting address, or "" when Firebase didn't name one. null = no conflict.
  const [popupConflict, setPopupConflict] = useState<string | null>(null);

  // Turns a popup-path failure into UI. The redirect path is derived below instead.
  const reportAuthError = useCallback((err: unknown) => {
    if (isCredentialConflictError(err)) {
      setPopupConflict(getConflictEmail(err) ?? "");
      return;
    }
    const message = getAuthErrorMessage(err);
    if (message) setError(message);
  }, []);

  // A redirect sign-in fails *before* this page reloads, so its error arrives through
  // context rather than a catch. Derive the display from it rather than copying it into
  // local state — the context already holds it, and mirroring would only add a render pass.
  const redirectConflict = isCredentialConflictError(redirectError)
    ? (getConflictEmail(redirectError) ?? "")
    : null;
  const credentialConflict = popupConflict ?? redirectConflict;
  const errorMessage =
    error ||
    (redirectError && !isCredentialConflictError(redirectError)
      ? getAuthErrorMessage(redirectError)
      : "");

  const dismissError = () => {
    setError("");
    if (redirectError) clearRedirectError();
  };

  // The single navigation path. Email sign-in, popup sign-in and the post-redirect return
  // all land here once Firebase reports a user, so the destination is resolved once and the
  // stored value consumed exactly once. Ref-guarded because Strict Mode double-invokes.
  //
  // postAuthDestination is what routes an unverified user heading for /checkout through
  // /verify-email first, instead of letting checkout bounce them there.
  const navigated = useRef(false);
  useEffect(() => {
    if (authLoading || !user || navigated.current) return;
    navigated.current = true;
    clearDestination();
    router.push(postAuthDestination(destination, user.emailVerified));
  }, [user, authLoading, destination, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    // A conflict raised by a social attempt is about a different sign-in method — leaving
    // it up would pin that panel over an unrelated email/password failure. Both sources
    // have to go, since credentialConflict falls back to the redirect-path one.
    setPopupConflict(null);
    if (redirectError) clearRedirectError();
    setLoading(true);
    try {
      await signIn(email, password, remember);
      // Navigation is the effect above's job — pushing here too raced it and could send
      // the user somewhere different from the social paths.
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (fn: () => Promise<void>) => {
    // Only the social paths write storage: signInWithRedirect is a full-page navigation
    // that destroys this component's state, so the destination needs somewhere to live.
    saveDestination(destination);
    setError("");
    setPopupConflict(null);
    // A stale failure from a previous redirect shouldn't linger over a fresh attempt.
    if (redirectError) clearRedirectError();
    try {
      await fn();
      // The effect above handles navigation and cleanup for both popup-success and
      // post-redirect-return paths.
    } catch (err) {
      clearDestination();
      reportAuthError(err);
    }
  };

  return (
    <>
      <SignInPane
        email={email}
        onEmailChange={setEmail}
        password={password}
        onPasswordChange={setPassword}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword((v) => !v)}
        remember={remember}
        onRememberChange={setRemember}
        loading={loading}
        credentialConflict={credentialConflict}
        sessionExpired={sessionExpired}
        onSubmit={handleSubmit}
        onGoogle={() => handleSocial(signInWithGoogle)}
        onApple={() => handleSocial(signInWithApple)}
      />

      <AuthErrorToast message={errorMessage} onDismiss={dismissError} />
    </>
  );
}

export default function LoginContent() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
