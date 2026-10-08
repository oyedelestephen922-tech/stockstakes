import type { Round, RoundMarketState } from "@/lib/types";

/**
 * DEMO round data.
 * In production, read the current round from the round contract (id, status,
 * pools) and crowd probabilities from an indexer. Close time is derived from
 * the clock in `lib/round-clock.ts`, so it is never hardcoded here.
 */
export const currentRound: Round = {
  id: 497608,
  status: "open",
  durationMinutes: 60,
  closeBufferMinutes: 0,
  settlementLabel: "After the hour",
  source: "demo",
  markets: [
    { marketId: "nvda", crowdYes: 61, poolEth: 4.82, entries: 213 },
    { marketId: "googl", crowdYes: 47, poolEth: 3.15, entries: 168 },
    { marketId: "eth", crowdYes: 66, poolEth: 7.4, entries: 341 },
  ],
};

/** Default call shown before the user changes anything. */
export const defaultCalls: Record<string, { yes: number; stakeEth: number }> = {
  nvda: { yes: 68, stakeEth: 0.025 },
  googl: { yes: 44, stakeEth: 0.025 },
  eth: { yes: 72, stakeEth: 0.025 },
};

/** Hero preview card. */
export const heroPreview = {
  marketId: "eth",
  yes: 72,
  stakeEth: 0.025,
};

export const stakePresets = [0.005, 0.01, 0.025, 0.05, 0.1] as const;

export const stakeLimits = { min: 0.001, max: 10 } as const;

export function getCurrentRound(): Round {
  return currentRound;
}

export function getRoundMarket(marketId: string): RoundMarketState | undefined {
  return currentRound.markets.find((m) => m.marketId === marketId);
}
