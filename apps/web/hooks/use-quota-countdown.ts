"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { parseQuotaSeconds } from "@/lib/errors";

/**
 * Manages Gemini API quota errors with auto-retry.
 * When a quota error is received, counts down and automatically
 * re-invokes the original request when the countdown hits zero.
 *
 * Usage:
 *   const { quotaSeconds, handleQuotaError } = useQuotaCountdown();
 *   // In your catch block:
 *   if (!handleQuotaError(err, () => myApiCall())) toast.error(...)
 */
export function useQuotaCountdown() {
  const [quotaSeconds, setQuotaSeconds] = useState(0);
  const retryFnRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (quotaSeconds <= 0) return;

    const id = setInterval(() => {
      setQuotaSeconds((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [quotaSeconds]);

  // When countdown reaches 0, fire the stored retry callback
  useEffect(() => {
    if (quotaSeconds === 0 && retryFnRef.current) {
      const fn = retryFnRef.current;
      retryFnRef.current = null;
      fn();
    }
  }, [quotaSeconds]);

  /**
   * Call from catch block. Starts countdown + schedules auto-retry.
   * @param error  The caught error
   * @param retry  The function to call when countdown expires
   * @returns true if it was a quota error (caller should NOT show toast)
   */
  const handleQuotaError = useCallback((error: unknown, retry?: () => void): boolean => {
    const seconds = parseQuotaSeconds(error);
    if (seconds !== null) {
      retryFnRef.current = retry ?? null;
      setQuotaSeconds(seconds);
      return true;
    }
    return false;
  }, []);

  return { quotaSeconds, handleQuotaError };
}
