"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { formatEther } from "viem";
import { stakesRoundsAbi } from "@/lib/web3/abis";
import { publicClient, TX_EVENT } from "@/lib/web3/client";
import { deployment, marketKey } from "@/lib/web3/chain";
import { contractsLive } from "@/lib/web3/contracts";
import { getCurrentRound, stakeLimits } from "@/data/rounds";
import { markets } from "@/data/markets";
import { roundNumberAt } from "@/lib/round-clock";
import type { Round, RoundMarketState } from "@/lib/types";

const POLL_MS = 20_000;

export interface RoundParams {
  minStakeEth: number;
  maxStakeEth: number;
  feeBps: number;
  /** Entries for a round close this many seconds before it starts. */
  entryCutoffSeconds: number;
  paused: boolean;
}

interface RoundContextValue {
  /** True once the round contract is deployed (lib/web3/deployment.ts). */
  live: boolean;
  /** Round taking entries now (= next hour index). null until mounted. */
  roundNo: number | null;
  round: Round;
  params: RoundParams;
  /** "loading" before the first on-chain read; "error" if reads are failing. */
  status: "prelaunch" | "loading" | "ready" | "error";
  refresh: () => void;
}

const fallbackParams: RoundParams = {
  minStakeEth: stakeLimits.min,
  maxStakeEth: stakeLimits.max,
  feeBps: 300,
  entryCutoffSeconds: 0,
  paused: false,
};

const RoundContext = createContext<RoundContextValue | null>(null);

/**
 * Live round state from StakesRounds: pool size, entries and the room's
 * average call for every market, plus stake limits and pause state.
 * Before the contracts are deployed it serves the static pre-launch round.
 */
export function RoundProvider({ children }: { children: React.ReactNode }) {
  const [roundNo, setRoundNo] = useState<number | null>(null);
  const [pools, setPools] = useState<RoundMarketState[] | null>(null);
  const [params, setParams] = useState<RoundParams>(fallbackParams);
  const [status, setStatus] = useState<RoundContextValue["status"]>(contractsLive ? "loading" : "prelaunch");
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);

  // Track the round number, rolling over exactly at the top of the hour.
  useEffect(() => {
    let timer: number;
    const update = () => {
      const now = Date.now();
      setRoundNo(roundNumberAt(now));
      timer = window.setTimeout(update, 3_600_000 - (now % 3_600_000) + 250);
    };
    update();
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!contractsLive || !deployment || roundNo === null) return;
    const address = deployment.stakesRounds;
    let cancelled = false;

    const load = async () => {
      try {
        const client = publicClient();
        const read = <T,>(functionName: string, args: readonly unknown[] = []) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          client.readContract({ address, abi: stakesRoundsAbi, functionName: functionName as any, args: args as any }) as Promise<T>;
        const [minStake, maxStake, feeBps, entryCutoff, paused, ...poolRows] = await Promise.all([
          read<bigint>("minStake"),
          read<bigint>("maxStake"),
          read<number>("feeBps"),
          read<number>("entryCutoff"),
          read<boolean>("paused"),
          ...markets.map((m) => read<readonly [bigint, number, number, number, number]>("getPool", [BigInt(roundNo), marketKey(m.id)])),
        ]);
        if (cancelled) return;
        setParams({
          minStakeEth: Number(formatEther(minStake)),
          maxStakeEth: Number(formatEther(maxStake)),
          feeBps: Number(feeBps),
          entryCutoffSeconds: Number(entryCutoff),
          paused,
        });
        setPools(
          markets.map((m, i) => {
            const [total, entries, crowdYesBps] = poolRows[i];
            return {
              marketId: m.id,
              poolEth: Number(formatEther(total)),
              entries: Number(entries),
              crowdYes: Number(entries) > 0 ? Math.round(Number(crowdYesBps) / 100) : null,
            };
          }),
        );
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus((s) => (s === "ready" ? "ready" : "error"));
      }
    };

    load();
    const id = window.setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(TX_EVENT, load);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(TX_EVENT, load);
    };
  }, [roundNo, tick]);

  const value = useMemo<RoundContextValue>(() => {
    const base = getCurrentRound();
    if (!contractsLive) return { live: false, roundNo, round: base, params, status, refresh };
    const round: Round = {
      ...base,
      status: params.paused ? "closed" : "open",
      closeBufferMinutes: params.entryCutoffSeconds / 60,
      source: "oracle",
      markets: pools ?? base.markets,
    };
    return { live: true, roundNo, round, params, status, refresh };
  }, [roundNo, pools, params, status, refresh]);

  return <RoundContext.Provider value={value}>{children}</RoundContext.Provider>;
}

export function useRound() {
  const ctx = useContext(RoundContext);
  if (!ctx) throw new Error("useRound must be used inside <RoundProvider>");
  return ctx;
}
