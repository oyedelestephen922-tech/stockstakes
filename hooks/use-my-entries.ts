"use client";

import { useCallback, useEffect, useState } from "react";
import { formatEther, getAddress, type Address, type Hex } from "viem";
import { stakesRoundsAbi } from "@/lib/web3/abis";
import { publicClient, TX_EVENT } from "@/lib/web3/client";
import { deployment, marketIdFromKey, targetChainId } from "@/lib/web3/chain";

const HOUR_MS = 3_600_000;
const MAX_LOG_RANGE = 9_000_000n; // the public RPC allows 10M blocks per getLogs
const SHOW = 50;
const OUTCOMES = ["Unsettled", "Up", "Down", "Refund"] as const;

export type EntryStatus = "open" | "live" | "settling" | "won" | "lost" | "even" | "refund" | "claimed" | "refunded";

export interface MyEntry {
  round: number;
  marketId: string;
  stakeEth: number;
  yes: number; // 0–100
  txHash: Hex;
  outcome: (typeof OUTCOMES)[number];
  claimed: boolean;
  /** What claiming now pays (0 once claimed or while unsettled). */
  payoutEth: number;
  status: EntryStatus;
  /** Round start (ms): the price move measured is from here to +1h. */
  startsAt: number;
}

interface Found {
  round: number;
  key: Hex;
  stake: string; // wei
  yesBps: number;
  tx: Hex;
}

interface Cache {
  scannedTo: string;
  found: Found[];
}

const cacheKey = (address: string) => `ss:entries:${targetChainId}:${deployment?.stakesRounds}:${address.toLowerCase()}`;

function loadCache(address: string): Cache | null {
  try {
    const raw = window.localStorage.getItem(cacheKey(address));
    return raw ? (JSON.parse(raw) as Cache) : null;
  } catch {
    return null;
  }
}

function saveCache(address: string, c: Cache) {
  try {
    window.localStorage.setItem(cacheKey(address), JSON.stringify(c));
  } catch {
    // storage unavailable — we just rescan next time
  }
}

/** Finds this wallet's entries from on-chain `Entered` events, then reads each one's state. */
export function useMyEntries(address: string | null) {
  const [entries, setEntries] = useState<MyEntry[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!deployment || !address) {
      setEntries([]);
      setStatus("idle");
      return;
    }
    const rounds = deployment.stakesRounds;
    const player = getAddress(address) as Address;
    let cancelled = false;

    const load = async () => {
      setStatus((s) => (s === "ready" ? s : "loading"));
      try {
        const client = publicClient();

        // 1. New Entered events since the last scan.
        const cache = loadCache(player) ?? { scannedTo: String(deployment!.deployBlock - 1), found: [] };
        const latest = await client.getBlockNumber();
        let from = BigInt(cache.scannedTo) + 1n;
        const found = [...cache.found];
        while (from <= latest) {
          const to = from + MAX_LOG_RANGE - 1n < latest ? from + MAX_LOG_RANGE - 1n : latest;
          const logs = await client.getContractEvents({
            address: rounds,
            abi: stakesRoundsAbi,
            eventName: "Entered",
            args: { player },
            fromBlock: from,
            toBlock: to,
          });
          for (const l of logs) {
            const round = Number(l.args.round);
            if (found.some((f) => f.round === round && f.key === l.args.market)) continue;
            found.push({ round, key: l.args.market!, stake: String(l.args.stake), yesBps: Number(l.args.yesBps), tx: l.transactionHash! });
          }
          from = to + 1n;
        }
        saveCache(player, { scannedTo: String(latest), found });

        // 2. Current state of the most recent entries.
        const recent = found.sort((a, b) => b.round - a.round).slice(0, SHOW);
        const states = await Promise.all(
          recent.map(async (f) => {
            const [entry, [outcome, payout]] = await Promise.all([
              client.readContract({ address: rounds, abi: stakesRoundsAbi, functionName: "getEntry", args: [BigInt(f.round), f.key, player] }),
              client.readContract({ address: rounds, abi: stakesRoundsAbi, functionName: "claimable", args: [BigInt(f.round), f.key, player] }),
            ]);
            return { claimed: entry[2], outcome: OUTCOMES[Number(outcome)] ?? "Unsettled", payout };
          }),
        );
        if (cancelled) return;

        const now = Date.now();
        setEntries(
          recent.map((f, i) => {
            const { claimed, outcome, payout } = states[i];
            const stakeEth = Number(formatEther(BigInt(f.stake)));
            const payoutEth = Number(formatEther(payout));
            const startsAt = f.round * HOUR_MS;
            let status: EntryStatus;
            if (outcome === "Unsettled") status = now < startsAt ? "open" : now < startsAt + HOUR_MS ? "live" : "settling";
            else if (outcome === "Refund") status = claimed ? "refunded" : "refund";
            else if (claimed) status = "claimed";
            else status = payoutEth > stakeEth ? "won" : payoutEth < stakeEth ? "lost" : "even";
            return {
              round: f.round,
              marketId: marketIdFromKey(f.key),
              stakeEth,
              yes: f.yesBps / 100,
              txHash: f.tx,
              outcome,
              claimed,
              payoutEth,
              status,
              startsAt,
            };
          }),
        );
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus((s) => (s === "ready" ? s : "error"));
      }
    };

    load();
    const id = window.setInterval(() => document.visibilityState === "visible" && load(), 60_000);
    window.addEventListener(TX_EVENT, load);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener(TX_EVENT, load);
    };
  }, [address, tick]);

  return { entries, status, refresh };
}
