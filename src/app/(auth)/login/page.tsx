"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { fadeUp } from "@/lib/motion";
import { useAuth } from "@/context/AuthContext";
import AuthForm from "@/components/auth/AuthForm";
import FloatingInput from "@/components/auth/FloatingInput";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import AuthErrorToast, { getAuthErrorMessage } from "@/components/auth/AuthErrorToast";

function resolveDestination(from: string | null): string {
  if (!from) return "/account";
  if (from === "checkout") return "/checkout";
  // Only allow same-origin absolute paths. Reject protocol-relative ("//evil.com")
  // and any other value to avoid an open redirect.
  if (from.startsWith("/") && !from.startsWith("//")) return from;
  return "/account";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const destination = resolveDestination(params.get("from"));
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setError("");
    try {
      await fn();
      router.push(destination);
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      if (msg) setError(msg);
    }
  };

  return (
    <>
      <AuthForm title="Welcome Back" subtitle="Sign in to your account">
        <SocialAuthButtons
          onGoogle={() => handleSocial(signInWithGoogle)}
          onApple={() => handleSocial(signInWithApple)}
          dividerLabel="or sign in with email"
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FloatingInput
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <FloatingInput
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-ink/40 hover:text-rose-gold transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          {/* Remember / forgot row */}
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-between"
          >
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-[#c9977a]"
              />
              <span
                className="text-ink/55"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "0.78rem" }}
              >
                Remember me
              </span>
            </label>
            <Link
              href="/forgot-password"
              className="text-rose-gold hover:opacity-70 transition-opacity"
              style={{ fontFamily: "var(--font-manrope)", fontSize: "0.78rem" }}
            >
              Forgot password?
            </Link>
          </motion.div>

          <motion.button
            variants={fadeUp}
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.015 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full py-4 rounded-full text-white font-semibold text-[11px] tracking-[0.13em] uppercase disabled:opacity-70"
            style={{
              background: "#c9977a",
              fontFamily: "var(--font-manrope)",
              boxShadow: "0 6px 24px rgba(201,151,122,0.38)",
            }}
          >
            {loading ? "Signing In…" : "Sign In"}
          </motion.button>
        </form>

        <motion.p
          variants={fadeUp}
          className="text-center text-ink/55"
          style={{ fontFamily: "var(--font-manrope)", fontSize: "0.82rem" }}
        >
          New here?{" "}
          <Link
            href="/signup"
            className="text-rose-gold font-medium hover:opacity-70 transition-opacity"
          >
            Create an account
          </Link>
        </motion.p>
      </AuthForm>

      <AuthErrorToast message={error} onDismiss={() => setError("")} />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
