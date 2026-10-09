"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMarkets, withQuotes } from "@/data/markets";
import type { LiveQuote, Market } from "@/lib/types";

const POLL_MS = 30_000;

interface MarketsContextValue {
  markets: Market[];
  /** "loading" before the first response, "live" when at least one price is in, "unavailable" if none could be fetched. */
  status: "loading" | "live" | "unavailable";
  updatedAt: Date | null;
  /** Market currently open in the live round. */
  selectedId: string;
  select: (id: string) => void;
}

const MarketsContext = createContext<MarketsContextValue | null>(null);

export function MarketsProvider({ children }: { children: React.ReactNode }) {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote | null>>({});
  const [status, setStatus] = useState<MarketsContextValue["status"]>("loading");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [selectedId, setSelectedId] = useState<string>(() => getMarkets().find((m) => m.category !== "Crypto")?.id ?? getMarkets()[0].id);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const load = async () => {
      try {
        const res = await fetch("/api/prices", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { updatedAt: string; quotes: Record<string, LiveQuote | null> };
        if (cancelled) return;
        setQuotes((prev) => {
          // Keep the last good quote if a single source blips.
          const next = { ...prev };
          for (const [id, q] of Object.entries(data.quotes)) if (q) next[id] = q;
          return next;
        });
        const anyLive = Object.values(data.quotes).some(Boolean);
        setStatus((s) => (anyLive ? "live" : s === "live" ? "live" : "unavailable"));
        if (anyLive) setUpdatedAt(new Date(data.updatedAt));
      } catch {
        if (!cancelled) setStatus((s) => (s === "live" ? "live" : "unavailable"));
      }
    };

    const schedule = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        if (document.visibilityState === "visible") load();
      }, POLL_MS);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };

    load();
    schedule();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const value = useMemo<MarketsContextValue>(
    () => ({ markets: withQuotes(getMarkets(), quotes), status, updatedAt, selectedId, select: setSelectedId }),
    [quotes, status, updatedAt, selectedId],
  );

  return <MarketsContext.Provider value={value}>{children}</MarketsContext.Provider>;
}

export function useMarkets() {
  const ctx = useContext(MarketsContext);
  if (!ctx) throw new Error("useMarkets must be used inside <MarketsProvider>");
  return ctx;
}
