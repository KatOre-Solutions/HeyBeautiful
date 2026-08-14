"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import AuthForm from "./AuthForm";
import FloatingInput from "./FloatingInput";
import SocialAuthButtons from "./SocialAuthButtons";
import { useAuthTransition } from "./AuthTransitionContext";

interface SignInPaneProps {
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  remember: boolean;
  onRememberChange: (value: boolean) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onGoogle: () => Promise<void>;
  onApple: () => Promise<void>;
}

export default function SignInPane({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  showPassword,
  onTogglePassword,
  remember,
  onRememberChange,
  loading,
  onSubmit,
  onGoogle,
  onApple,
}: SignInPaneProps) {
  const { requestSwitch, isTransitioning, notifyPaneReady } = useAuthTransition();

  // Tell the blade this pane is up. The effect runs post-commit, so the pane is
  // already mounted here; the rAF then guarantees it has *painted* before the
  // blade uncovers it. Waiting on a real signal — rather than assuming a frame
  // or two is enough — is what keeps the reveal correct on a slow device.
  useEffect(() => {
    const id = requestAnimationFrame(() => notifyPaneReady("signin"));
    return () => cancelAnimationFrame(id);
  }, [notifyPaneReady]);

  return (
    <AuthForm title="Welcome Back" subtitle="Sign in to your account">
      <SocialAuthButtons onGoogle={onGoogle} onApple={onApple} dividerLabel="or sign in with email" />

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FloatingInput
          id="email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          autoComplete="email"
          required
        />

        <FloatingInput
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          autoComplete="current-password"
          required
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

        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => onRememberChange(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-dusty-pink"
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
            className="text-dusty-pink hover:opacity-70 transition-opacity"
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
          className="btn-primary-gradient w-full py-4 disabled:opacity-70"
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
        {/* A real anchor, so middle-click and open-in-new-tab still work and the
            route is reachable without JS; the click handler takes over to play
            the blade sweep instead of a plain navigation. */}
        <Link
          href="/signup"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            requestSwitch("signup", "/signup");
          }}
          aria-disabled={isTransitioning || undefined}
          className={cn(
            "text-dusty-pink font-medium hover:opacity-70 transition-opacity",
            isTransitioning && "pointer-events-none opacity-40"
          )}
        >
          Create an account
        </Link>
      </motion.p>
    </AuthForm>
  );
}
