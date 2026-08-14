"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { fadeUp } from "@/lib/motion";
import AuthForm from "./AuthForm";
import FloatingInput from "./FloatingInput";
import SocialAuthButtons from "./SocialAuthButtons";
import { useAuthTransition } from "./AuthTransitionContext";

/**
 * Weak → strong stays a semantic progression (it's a usability signal, not
 * decoration — same reason inline field errors stay red), but each stop is
 * re-tinted from the brand palette so it doesn't read as an off-the-shelf meter.
 * "Strong" lands on an emerald tint, a nod to dark-emerald as the supporting
 * contrast colour.
 */
export const STRENGTH_LABELS = ["Weak", "Fair", "Good", "Strong"];
export const STRENGTH_COLORS = ["#d97b6c", "#dba15a", "#c9977a", "#5c7350"];

interface SignUpPaneProps {
  name: string;
  onNameChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  confirm: string;
  onConfirmChange: (value: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  agreed: boolean;
  onAgreedChange: (value: boolean) => void;
  strength: number;
  loading: boolean;
  fieldErrors: { password?: string; confirm?: string; agree?: string };
  onSubmit: (e: React.FormEvent) => void;
  onGoogle: () => Promise<void>;
  onApple: () => Promise<void>;
}

export default function SignUpPane({
  name,
  onNameChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  confirm,
  onConfirmChange,
  showPassword,
  onTogglePassword,
  agreed,
  onAgreedChange,
  strength,
  loading,
  fieldErrors,
  onSubmit,
  onGoogle,
  onApple,
}: SignUpPaneProps) {
  const { requestSwitch, isTransitioning, notifyPaneReady, lastLoginFrom } = useAuthTransition();

  useEffect(() => {
    const id = requestAnimationFrame(() => notifyPaneReady("signup"));
    return () => cancelAnimationFrame(id);
  }, [notifyPaneReady]);

  // Carry the destination back if the user arrived here from /login?from=…
  const signInHref = lastLoginFrom
    ? `/login?from=${encodeURIComponent(lastLoginFrom)}`
    : "/login";

  return (
    <AuthForm title="Begin Your Journey" subtitle="Create your account">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FloatingInput
          id="name"
          label="Full Name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          autoComplete="name"
          required
        />

        <FloatingInput
          id="email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          autoComplete="email"
          required
        />

        <div>
          <FloatingInput
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            autoComplete="new-password"
            required
            error={fieldErrors.password}
            rightElement={
              <button
                type="button"
                onClick={onTogglePassword}
                className="text-ink/40 hover:text-dusty-pink transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          {password.length > 0 && (
            <div className="flex items-center gap-2 mt-2 ml-1">
              <div className="flex gap-1 flex-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-colors duration-300"
                    style={{
                      background:
                        i < strength ? STRENGTH_COLORS[strength - 1] : "rgba(232,220,208,1)",
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
          onChange={(e) => onConfirmChange(e.target.value)}
          autoComplete="new-password"
          required
          error={fieldErrors.confirm}
        />

        <motion.div variants={fadeUp}>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => onAgreedChange(e.target.checked)}
              className="w-3.5 h-3.5 mt-0.5 rounded accent-dusty-pink flex-shrink-0"
            />
            <span
              className="text-ink/55 leading-snug"
              style={{ fontFamily: "var(--font-manrope)", fontSize: "0.78rem" }}
            >
              I agree to the{" "}
              <Link href="#" className="text-dusty-pink hover:opacity-70">
                Terms
              </Link>{" "}
              &{" "}
              <Link href="#" className="text-dusty-pink hover:opacity-70">
                Privacy Policy
              </Link>
            </span>
          </label>
          {fieldErrors.agree && (
            <p
              className="mt-1.5 ml-6 text-xs text-red-400"
              style={{ fontFamily: "var(--font-manrope)" }}
            >
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
          className="btn-primary-gradient w-full py-4 disabled:opacity-70"
        >
          {loading ? "Creating Account…" : "Create Account"}
        </motion.button>
      </form>

      <SocialAuthButtons onGoogle={onGoogle} onApple={onApple} dividerLabel="or sign up with" />

      <motion.p
        variants={fadeUp}
        className="text-center text-ink/55"
        style={{ fontFamily: "var(--font-manrope)", fontSize: "0.82rem" }}
      >
        Already a member?{" "}
        <button
          type="button"
          onClick={() => requestSwitch("signin", signInHref)}
          disabled={isTransitioning}
          className="text-dusty-pink font-medium hover:opacity-70 transition-opacity disabled:opacity-40"
        >
          Sign in
        </button>
      </motion.p>
    </AuthForm>
  );
}
