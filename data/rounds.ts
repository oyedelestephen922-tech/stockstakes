import type { Round, RoundMarketState } from "@/lib/types";

/**
 * Round configuration.
 *
 * Pools, entries and the room's average probability come from the round
 * contract. It is not deployed yet, so those fields are null and the UI shows
 * "Opens at launch" — never invented numbers. Round numbers and close times
 * are derived from the clock (see lib/round-clock.ts).
 */
export const currentRound: Round = {
  status: "prelaunch",
  durationMinutes: 60,
  closeBufferMinutes: 0,
  settlementLabel: "Top of the hour",
  source: "api",
  markets: [
    { marketId: "nvda", crowdYes: null, poolEth: null, entries: null },
    { marketId: "googl", crowdYes: null, poolEth: null, entries: null },
    { marketId: "eth", crowdYes: null, poolEth: null, entries: null },
  ],
};

/** Neutral reference used for estimates while there is no live room. */
export const NEUTRAL_ROOM = 50;

/** Starting call shown before the user changes anything. */
export const defaultCalls: Record<string, { yes: number; stakeEth: number }> = {
  nvda: { yes: 65, stakeEth: 0.025 },
  googl: { yes: 45, stakeEth: 0.025 },
  eth: { yes: 72, stakeEth: 0.025 },
};

/** Hero preview card (an example call, not a live position). */
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
