"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SignUpPane from "@/components/auth/SignUpPane";
import AuthErrorToast, { getAuthErrorMessage } from "@/components/auth/AuthErrorToast";
import { REDIRECT_KEY } from "@/lib/constants";

function getStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

export default function SignupContent() {
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithApple, user, loading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string; agree?: string }>({});

  const strength = useMemo(() => getStrength(password), [password]);

  // Navigate after popup-success or after signInWithRedirect round-trip returns.
  useEffect(() => {
    if (authLoading || !user) return;
    sessionStorage.removeItem(REDIRECT_KEY);
    router.push("/account");
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    const errs: typeof fieldErrors = {};
    // Firebase requires a 6+ char password — pre-validate for a deterministic
    // inline error instead of a round-trip that returns auth/weak-password.
    if (password.length < 6) errs.password = "Password must be at least 6 characters.";
    if (confirm !== password) errs.confirm = "Passwords do not match.";
    if (!agreed) errs.agree = "Please accept the terms to continue.";
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      await signUp(email, password, name);
      router.push("/verify-email");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (fn: () => Promise<void>) => {
    sessionStorage.setItem(REDIRECT_KEY, "/account");
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
      <SignUpPane
        name={name}
        onNameChange={setName}
        email={email}
        onEmailChange={setEmail}
        password={password}
        onPasswordChange={setPassword}
        confirm={confirm}
        onConfirmChange={setConfirm}
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

      <AuthErrorToast message={error} onDismiss={() => setError("")} />
    </>
  );
}
