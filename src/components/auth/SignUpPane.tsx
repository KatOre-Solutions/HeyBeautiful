"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { withFrom } from "@/lib/redirect";
import { MIN_PASSWORD_LENGTH } from "@/lib/constants";
import {
  PASSWORD_STRENGTH_COLOR,
  PASSWORD_STRENGTH_LABEL,
  PASSWORD_STRENGTH_SEGMENTS,
  type PasswordStrength,
} from "@/lib/password";
import AccountExistsNotice from "./AccountExistsNotice";
import AuthForm from "./AuthForm";
import FloatingInput from "./FloatingInput";
import SocialAuthButtons from "./SocialAuthButtons";
import { useAuthTransition } from "./AuthTransitionContext";

/** Strength scale, labels and tints live in @/lib/password — see the note there on why
 *  it's three states and not four. */

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
  strength: PasswordStrength;
  loading: boolean;
  fieldErrors: { email?: string; password?: string; confirm?: string; agree?: string };
  /** Firebase refused because this address already has an account. */
  emailAlreadyInUse?: boolean;
  /**
   * A social sign-in clashed with an existing account. The string is the conflicting
   * address (empty when Firebase didn't supply one); `null` means no conflict.
   */
  credentialConflict?: string | null;
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
  emailAlreadyInUse = false,
  credentialConflict = null,
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
  // withFrom does the validating and encoding, so this stays inside the one boundary.
  const signInHref = withFrom("/login", lastLoginFrom);
  const resetHref = withFrom("/forgot-password", lastLoginFrom);

  // Keep the blade sweep for in-app switches, but let modified clicks open a new tab.
  const switchToSignIn = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    requestSwitch("signin", signInHref);
  };

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

        <div>
          <FloatingInput
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            autoComplete="email"
            required
            error={fieldErrors.email}
          />

          {/* Already registered isn't a failure — it means they're a customer already, so
              point at the two things that actually help rather than a red toast. */}
          {(emailAlreadyInUse || credentialConflict !== null) && (
            <AccountExistsNotice
              signInHref={signInHref}
              resetHref={resetHref}
              onSignIn={switchToSignIn}
            >
              {credentialConflict !== null
                ? `${credentialConflict || "That email"} already has an account created with a different sign-in method. Please sign in the way you first signed up.`
                : "You already have an account with this email."}
            </AccountExistsNotice>
          )}
        </div>

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
            <>
              <div className="flex items-center gap-2 mt-2 ml-1">
                <div className="flex gap-1 flex-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-colors duration-300"
                      style={{
                        background:
                          i < PASSWORD_STRENGTH_SEGMENTS[strength]
                            ? PASSWORD_STRENGTH_COLOR[strength]
                            : "rgba(232,220,208,1)",
                      }}
                    />
                  ))}
                </div>
                <span
                  className="text-[10px] font-medium"
                  style={{
                    fontFamily: "var(--font-manrope)",
                    color: PASSWORD_STRENGTH_COLOR[strength],
                    minWidth: "62px",
                  }}
                >
                  {PASSWORD_STRENGTH_LABEL[strength]}
                </span>
              </div>
              {/* Say the rule out loud while it's unmet — the meter alone doesn't tell you
                  what to do, and this is the only thing that actually blocks submission. */}
              {strength === "too-short" && !fieldErrors.password && (
                <p
                  className="mt-1.5 ml-1 text-ink/45"
                  style={{ fontFamily: "var(--font-manrope)", fontSize: "0.72rem" }}
                >
                  Use at least {MIN_PASSWORD_LENGTH} characters.
                </p>
              )}
            </>
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
              <Link href="#" className="text-rose-dark hover:opacity-70">
                Terms
              </Link>{" "}
              &{" "}
              <Link href="#" className="text-rose-dark hover:opacity-70">
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
        {/* See SignInPane — anchor for middle-click / new-tab / no-JS, click
            handler for the blade sweep. */}
        <Link
          href={signInHref}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            requestSwitch("signin", signInHref);
          }}
          aria-disabled={isTransitioning || undefined}
          className={cn(
            "text-rose-dark font-medium hover:opacity-70 transition-opacity",
            isTransitioning && "pointer-events-none opacity-40"
          )}
        >
          Sign in
        </Link>
      </motion.p>
    </AuthForm>
  );
}
