"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SignInPane from "@/components/auth/SignInPane";
import { useAuthTransition } from "@/components/auth/AuthTransitionContext";
import AuthErrorToast, { getAuthErrorMessage } from "@/components/auth/AuthErrorToast";
import { REDIRECT_KEY } from "@/lib/constants";
import { resolveDestination } from "@/lib/redirect";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setLastLoginFrom } = useAuthTransition();
  const fromParam = params.get("from");
  const destination = useMemo(() => {
    if (fromParam) return resolveDestination(fromParam);
    const saved =
      typeof window !== "undefined"
        ? sessionStorage.getItem(REDIRECT_KEY)
        : null;
    return saved ?? "/account";
  }, [fromParam]);
  const { signIn, signInWithGoogle, signInWithApple, user, loading: authLoading } = useAuth();

  // Stash it on the card so a /login → /signup → /login bounce keeps the
  // destination; AuthCard outlives both routes, so the value survives.
  useEffect(() => {
    if (fromParam) setLastLoginFrom(fromParam);
  }, [fromParam, setLastLoginFrom]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;
    const dest =
      (typeof window !== "undefined"
        ? sessionStorage.getItem(REDIRECT_KEY)
        : null) ?? destination;
    sessionStorage.removeItem(REDIRECT_KEY);
    router.push(dest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await signIn(email, password, remember);
      router.push(destination);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (fn: () => Promise<void>) => {
    sessionStorage.setItem(REDIRECT_KEY, destination);
    setError("");
    try {
      await fn();
      // useEffect([user, authLoading]) handles navigation and cleanup for both
      // popup-success and post-redirect-return paths
    } catch (err) {
      sessionStorage.removeItem(REDIRECT_KEY);
      const msg = getAuthErrorMessage(err);
      if (msg) setError(msg);
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
        onSubmit={handleSubmit}
        onGoogle={() => handleSocial(signInWithGoogle)}
        onApple={() => handleSocial(signInWithApple)}
      />

      <AuthErrorToast message={error} onDismiss={() => setError("")} />
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
