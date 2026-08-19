"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SignUpPane from "@/components/auth/SignUpPane";
import { useAuthTransition } from "@/components/auth/AuthTransitionContext";
import AuthErrorToast from "@/components/auth/AuthErrorToast";
import {
  getAuthErrorMessage,
  getConflictEmail,
  isCredentialConflictError,
  isEmailInUseError,
} from "@/lib/auth-errors";
import { isPlausibleEmail } from "@/lib/email";
import { MIN_PASSWORD_LENGTH } from "@/lib/constants";
import { getPasswordStrength } from "@/lib/password";
import {
  DEFAULT_DESTINATION,
  clearDestination,
  postAuthDestination,
  readDestination,
  resolveDestination,
  saveDestination,
  withFrom,
} from "@/lib/redirect";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setLastLoginFrom } = useAuthTransition();
  const fromParam = params.get("from");
  // Same precedence as /login (see src/lib/redirect.ts): an invalid `from` resolves to the
  // default rather than falling through to stored state.
  const destination = useMemo(
    () =>
      fromParam !== null
        ? resolveDestination(fromParam)
        : readDestination() ?? DEFAULT_DESTINATION,
    [fromParam]
  );
  const {
    signUp,
    signInWithGoogle,
    signInWithApple,
    user,
    loading: authLoading,
    redirectError,
    clearRedirectError,
  } = useAuth();

  // Keeps SignUpPane's "Sign in" link pointing back at the destination even when the user
  // landed on /signup?from=… directly rather than bouncing through /login.
  useEffect(() => {
    if (destination !== DEFAULT_DESTINATION) setLastLoginFrom(destination);
  }, [destination, setLastLoginFrom]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirm?: string;
    agree?: string;
  }>({});
  // Not an error state so much as "you already have an account" — rendered inline with
  // routes to sign in or reset, rather than as a toast that vanishes.
  const [emailAlreadyInUse, setEmailAlreadyInUse] = useState(false);
  // Conflicting address, or "" when Firebase didn't name one. null = no conflict.
  const [popupConflict, setPopupConflict] = useState<string | null>(null);

  // Turns a popup-path or email-signup failure into UI. The redirect path is derived below.
  const reportAuthError = useCallback((err: unknown) => {
    if (isCredentialConflictError(err)) {
      setPopupConflict(getConflictEmail(err) ?? "");
      return;
    }
    if (isEmailInUseError(err)) {
      setEmailAlreadyInUse(true);
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

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  // Claimed by whichever path navigates first, so the auth-state effect and the submit
  // handler can never both push.
  const navigated = useRef(false);

  // Social sign-up: navigate after popup-success or after the signInWithRedirect round trip
  // returns. Email sign-up claims the navigation itself (see handleSubmit).
  //
  // Google and Apple normally hand back an already-verified email, but that isn't
  // guaranteed, so the same unverified routing as /login applies rather than assuming it.
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
    setEmailAlreadyInUse(false);

    // Everything checkable locally is checked here, so an obviously-invalid form never
    // costs a network round trip and the user gets a precise inline error instead of a
    // translated Firebase code.
    const errs: typeof fieldErrors = {};
    if (!isPlausibleEmail(email)) errs.email = "Please enter a valid email address.";
    if (password.length < MIN_PASSWORD_LENGTH)
      errs.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (confirm !== password) errs.confirm = "Passwords do not match.";
    if (!agreed) errs.agree = "Please accept the terms to continue.";
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

    // Claim the navigation *before* creating the account. signUp() awaits the profile
    // update and verification email after the user already exists, so the effect above
    // would otherwise fire first and send a brand-new signup straight to `destination`
    // instead of through /verify-email.
    navigated.current = true;
    setLoading(true);
    try {
      // Only rejects when the account was NOT created. A partial failure after creation
      // comes back in the result, because the account is real and the user must be sent on
      // to verification rather than told to try again.
      const result = await signUp(email, password, name);
      clearDestination();
      const verifyUrl = withFrom("/verify-email", destination);
      const separator = verifyUrl.includes("?") ? "&" : "?";
      router.push(
        result.verificationEmailSent ? verifyUrl : `${verifyUrl}${separator}sent=0`
      );
    } catch (err) {
      navigated.current = false;
      // email-already-in-use isn't a failure to explain away — they have an account, and
      // reportAuthError turns it into the inline route back in.
      reportAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (fn: () => Promise<void>) => {
    // Only the social paths write storage — signInWithRedirect destroys this component.
    saveDestination(destination);
    setError("");
    setPopupConflict(null);
    // The email path's notice doesn't apply to the provider they just picked.
    setEmailAlreadyInUse(false);
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
      <SignUpPane
        name={name}
        onNameChange={setName}
        email={email}
        onEmailChange={(value) => {
          setEmail(value);
          // Editing the address makes the "already registered" notice stale.
          if (emailAlreadyInUse) setEmailAlreadyInUse(false);
          if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
        }}
        emailAlreadyInUse={emailAlreadyInUse}
        credentialConflict={credentialConflict}
        password={password}
        onPasswordChange={(value) => {
          setPassword(value);
          // Clear both: the strength hint in SignUpPane is gated on !fieldErrors.password,
          // so leaving it set hides the "use at least 8 characters" guidance for good, and
          // a length fix usually resolves the mismatch error too.
          if (fieldErrors.password)
            setFieldErrors((f) => ({ ...f, password: undefined }));
          if (fieldErrors.confirm)
            setFieldErrors((f) => ({ ...f, confirm: undefined }));
        }}
        confirm={confirm}
        onConfirmChange={(value) => {
          setConfirm(value);
          if (fieldErrors.confirm)
            setFieldErrors((f) => ({ ...f, confirm: undefined }));
        }}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword((v) => !v)}
        agreed={agreed}
        onAgreedChange={(value) => {
          setAgreed(value);
          if (value) setFieldErrors((f) => ({ ...f, agree: undefined }));
        }}
        strength={strength}
        loading={loading}
        fieldErrors={fieldErrors}
        onSubmit={handleSubmit}
        onGoogle={() => handleSocial(signInWithGoogle)}
        onApple={() => handleSocial(signInWithApple)}
      />

      <AuthErrorToast message={errorMessage} onDismiss={dismissError} />
    </>
  );
}

export default function SignupContent() {
  // useSearchParams requires a Suspense boundary (matches LoginContent).
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
