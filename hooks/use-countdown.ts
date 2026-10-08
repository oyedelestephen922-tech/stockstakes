"use client";

import { useEffect, useState } from "react";

export interface CountdownState {
  /** null until mounted — avoids server/client hydration mismatch. */
  remainingMs: number | null;
  minutes: number;
  seconds: number;
  /** 0–1 progress through the current window. */
  progress: number;
  isClosed: boolean;
}

/**
 * Generic countdown. Pass a function that returns the target timestamp so the
 * target can roll forward (e.g. to the next hourly round) once it passes.
 */
export function useCountdown(getTarget: (now: number) => number, windowMs = 60 * 60 * 1000): CountdownState {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (now === null) {
    return { remainingMs: null, minutes: 0, seconds: 0, progress: 0, isClosed: false };
  }

  const target = getTarget(now);
  const remainingMs = Math.max(0, target - now);
  const totalSeconds = Math.floor(remainingMs / 1000);
  return {
    remainingMs,
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
    progress: 1 - Math.min(1, remainingMs / windowMs),
    isClosed: remainingMs === 0,
  };
}
