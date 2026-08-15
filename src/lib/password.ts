import { MIN_PASSWORD_LENGTH } from "@/lib/constants";

/**
 * Password feedback, deliberately kept to three states.
 *
 * The enforced policy is length only (`MIN_PASSWORD_LENGTH`). A four-bar meter scored on
 * uppercase / digits / symbols implied those were required and quietly disagreed with what
 * signup actually rejects — someone with a long, strong passphrase saw a mediocre score,
 * while "Passw0rd!" looked excellent. These three states line up exactly with the rule:
 *
 * - `too-short`  — the only state that blocks submission
 * - `acceptable` — meets the floor and will be accepted
 * - `strong`     — comfortably beyond it
 *
 * "Strong" is earned by *length* first, because length is what actually resists guessing;
 * character variety is a secondary route so a shorter mixed password isn't under-sold.
 */
export type PasswordStrength = "empty" | "too-short" | "acceptable" | "strong";

/** Length at which a password counts as strong on length alone. */
const STRONG_LENGTH = 12;

/** Length at which a mixed-character password counts as strong. */
const STRONG_MIXED_LENGTH = 10;

export function countCharacterClasses(password: string): number {
  let classes = 0;
  if (/[a-z]/.test(password)) classes += 1;
  if (/[A-Z]/.test(password)) classes += 1;
  if (/[0-9]/.test(password)) classes += 1;
  if (/[^A-Za-z0-9]/.test(password)) classes += 1;
  return classes;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "empty";
  if (password.length < MIN_PASSWORD_LENGTH) return "too-short";
  if (password.length >= STRONG_LENGTH) return "strong";
  if (password.length >= STRONG_MIXED_LENGTH && countCharacterClasses(password) >= 3) {
    return "strong";
  }
  return "acceptable";
}

export const PASSWORD_STRENGTH_LABEL: Record<PasswordStrength, string> = {
  empty: "",
  "too-short": "Too short",
  acceptable: "Acceptable",
  strong: "Strong",
};

/**
 * Brand-palette tints rather than a stock red/amber/green ramp. "Too short" is the warm
 * terracotta already used for inline field errors; "strong" lands on the supporting
 * emerald.
 */
export const PASSWORD_STRENGTH_COLOR: Record<PasswordStrength, string> = {
  empty: "transparent",
  "too-short": "#d97b6c",
  acceptable: "#c9977a",
  strong: "#5c7350",
};

/** How many of the three meter segments are lit. */
export const PASSWORD_STRENGTH_SEGMENTS: Record<PasswordStrength, number> = {
  empty: 0,
  "too-short": 1,
  acceptable: 2,
  strong: 3,
};
