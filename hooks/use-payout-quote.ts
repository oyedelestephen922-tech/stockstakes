"use client";

import { useEffect, useState } from "react";
import { formatEther, parseEther, zeroAddress, type Address } from "viem";
import { stakesRoundsAbi } from "@/lib/web3/abis";
import { publicClient } from "@/lib/web3/client";
import { deployment, marketKey } from "@/lib/web3/chain";
import { estimatePayout } from "@/lib/scoring";
import { NEUTRAL_ROOM } from "@/data/rounds";
import { useRound } from "@/providers/round-provider";
import { useWallet } from "@/providers/wallet-provider";

export interface PayoutQuote {
  ifYes: number;
  ifNo: number;
  favoured: number;
  favouredSide: "YES" | "NO";
  /** true = the contract's exact payout if the pool closed as it is now; false = illustrative estimate. */
  exact: boolean;
}

/**
 * Payout for a call on `marketId`. Once the contracts are live this is the
 * contract's own `quote()` — the same maths `claim` uses — for this round's
 * pool as it stands (it moves as others join). Before launch it falls back to
 * the illustrative estimate in lib/scoring.ts.
 */
export function usePayoutQuote(marketId: string, yes: number, stakeEth: number, crowdYes: number | null): PayoutQuote {
  const { live, roundNo, round } = useRound();
  const wallet = useWallet();
  const player = (wallet.session?.kind === "injected" ? wallet.session.address : null) ?? zeroAddress;
  const estimate = { ...estimatePayout(yes, stakeEth, crowdYes ?? NEUTRAL_ROOM), exact: false };
  const [quote, setQuote] = useState<{ marketKey: string; ifYes: number; ifNo: number } | null>(null);

  // Re-quote when inputs change or the pool updates (round.markets refreshes every poll).
  const poolKey = round.markets.find((m) => m.marketId === marketId)?.poolEth;
  // While a new quote loads, keep showing the last one for the same round and market
  // rather than flipping to the estimate formula.
  const sameMarket = `${roundNo}:${marketId}:${player}`;

  useEffect(() => {
    if (!live || !deployment || roundNo === null || !(stakeEth > 0)) return;
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const [ifUp, ifDown] = await publicClient().readContract({
          address: deployment!.stakesRounds,
          abi: stakesRoundsAbi,
          functionName: "quote",
          args: [BigInt(roundNo), marketKey(marketId), player as Address, Math.round(yes * 100), parseEther(stakeEth.toFixed(6))],
        });
        if (!cancelled) setQuote({ marketKey: sameMarket, ifYes: Number(formatEther(ifUp)), ifNo: Number(formatEther(ifDown)) });
      } catch {
        // keep the last quote; the estimate shows until the first one arrives
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [live, roundNo, marketId, yes, stakeEth, player, sameMarket, poolKey]);

  if (!live || !quote || quote.marketKey !== sameMarket) return estimate;
  const favouredSide = yes >= 50 ? "YES" : "NO";
  return {
    ifYes: quote.ifYes,
    ifNo: quote.ifNo,
    favoured: favouredSide === "YES" ? quote.ifYes : quote.ifNo,
    favouredSide,
    exact: true,
  };
}
