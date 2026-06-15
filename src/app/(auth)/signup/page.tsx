"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { fadeUp } from "@/lib/motion";
import { useAuth } from "@/context/AuthContext";
import AuthForm from "@/components/auth/AuthForm";
import FloatingInput from "@/components/auth/FloatingInput";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import AuthErrorToast, { getAuthErrorMessage } from "@/components/auth/AuthErrorToast";

const STRENGTH_LABELS = ["Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["#e57373", "#e0a04d", "#b8b04d", "#7ba05b"];

function getStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();

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
    setError("");
    try {
      await fn();
      router.push("/account");
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      if (msg) setError(msg);
    }
  };

  return (
    <>
      <AuthForm title="Begin Your Journey" subtitle="Create your account">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FloatingInput
            id="name"
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />

          <FloatingInput
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <div>
            <FloatingInput
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              error={fieldErrors.password}
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

            {/* Strength bar */}
            {password.length > 0 && (
              <div className="flex items-center gap-2 mt-2 ml-1">
                <div className="flex gap-1 flex-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-colors duration-300"
                      style={{
                        background:
                          i < strength
                            ? STRENGTH_COLORS[strength - 1]
                            : "rgba(232,220,208,1)",
                      }}
                    />
                  ))}
                </div>
                <span
                  className="text-[10px] font-medium"
                  style={{
                    fontFamily: "var(--font-manrope)",
                    color: strength > 0 ? STRENGTH_COLORS[strength - 1] : "transparent",
                    minWidth: "38px",
                  }}
                >
                  {strength > 0 ? STRENGTH_LABELS[strength - 1] : ""}
                </span>
              </div>
            )}
          </div>

          <FloatingInput
            id="confirmPassword"
            label="Confirm Password"
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            error={fieldErrors.confirm}
          />

          {/* Terms checkbox */}
          <motion.div variants={fadeUp}>
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  if (e.target.checked) setFieldErrors((f) => ({ ...f, agree: undefined }));
                }}
                className="w-3.5 h-3.5 mt-0.5 rounded accent-[#c9977a] flex-shrink-0"
              />
              <span
                className="text-ink/55 leading-snug"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "0.78rem" }}
              >
                I agree to the{" "}
                <Link href="#" className="text-rose-gold hover:opacity-70">
                  Terms
                </Link>{" "}
                &{" "}
                <Link href="#" className="text-rose-gold hover:opacity-70">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {fieldErrors.agree && (
              <p className="mt-1.5 ml-6 text-xs text-red-400" style={{ fontFamily: "var(--font-manrope)" }}>
                {fieldErrors.agree}
              </p>
            )}
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
            {loading ? "Creating Account…" : "Create Account"}
          </motion.button>
        </form>

        <SocialAuthButtons
          onGoogle={() => handleSocial(signInWithGoogle)}
          onApple={() => handleSocial(signInWithApple)}
          dividerLabel="or sign up with"
        />

        <motion.p
          variants={fadeUp}
          className="text-center text-ink/55"
          style={{ fontFamily: "var(--font-manrope)", fontSize: "0.82rem" }}
        >
          Already a member?{" "}
          <Link
            href="/login"
            className="text-rose-gold font-medium hover:opacity-70 transition-opacity"
          >
            Sign in
          </Link>
        </motion.p>
      </AuthForm>

      <AuthErrorToast message={error} onDismiss={() => setError("")} />
    </>
  );
}
