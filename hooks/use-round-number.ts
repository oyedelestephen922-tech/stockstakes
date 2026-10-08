"use client";

import { useEffect, useState } from "react";
import { roundNumberAt } from "@/lib/round-clock";

/** Current hourly round number. null until mounted (avoids a hydration mismatch). */
export function useRoundNumber(): number | null {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setN(roundNumberAt(Date.now()));
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, []);
  return n;
}
