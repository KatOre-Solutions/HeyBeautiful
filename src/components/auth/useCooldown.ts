"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * A seconds countdown for rate-limited actions — resending a verification email, requesting
 * another password reset link.
 *
 * A chained `setTimeout` rather than an interval: it re-arms once per tick and clears on
 * every render pass, so it can't outlive the component or double up under Strict Mode.
 *
 * Returns the remaining seconds (0 when idle) and a `start` to begin the countdown.
 */
export function useCooldown(): {
  remaining: number;
  active: boolean;
  start: (seconds: number) => void;
  reset: () => void;
} {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const start = useCallback((seconds: number) => setRemaining(seconds), []);
  const reset = useCallback(() => setRemaining(0), []);

  return { remaining, active: remaining > 0, start, reset };
}
