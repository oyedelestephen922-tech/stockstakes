/**
 * Shared domain types. Mock data in /data conforms to these shapes, so a real
 * API, oracle or contract reader can replace it without touching components.
 */

export type MarketCategory = "Technology" | "Crypto";

/** Data provenance — every number on screen says where it came from. */
export type DataSource = "demo" | "api" | "oracle";

export type RoundStatus = "open" | "closed" | "settling" | "settled";

/** Statuses for a user's own position / transaction. */
export type PositionStatus =
  | "demo"
  | "awaiting-wallet"
  | "pending"
  | "unavailable"
  | "open"
  | "closed"
  | "settling"
  | "settled";

export interface Market {
  id: string;
  symbol: string; // e.g. "NVDA"
  name: string; // e.g. "NVIDIA"
  pair: string; // e.g. "NVDA / USD"
  category: MarketCategory;
  /** Live price. null until a price feed is connected — the UI shows nothing. */
  price: number | null;
  hourlyChangePct: number | null;
  /** Recent price points for a sparkline, oldest first. Empty until a feed is connected. */
  history: number[];
  question: string;
  source: DataSource;
}

export interface RoundMarketState {
  marketId: string;
  /** Average YES probability across all entries so far (0–100). */
  crowdYes: number;
  /** Total ETH staked on this market this round. */
  poolEth: number;
  entries: number;
}

export interface Round {
  id: number;
  status: RoundStatus;
  /** Round length in minutes. Close time is derived from the clock. */
  durationMinutes: number;
  /** Minutes before the top of the hour when entries stop. */
  closeBufferMinutes: number;
  settlementLabel: string;
  markets: RoundMarketState[];
  source: DataSource;
}

export interface TokenInfo {
  symbol: string;
  name: string;
  /** null until the token is live. Never fill this with a placeholder. */
  contractAddress: string | null;
  chain: string | null;
  description: string;
}

/** A user's draft call on one market before it is submitted. */
export interface CallDraft {
  marketId: string;
  yes: number; // 0–100, NO is always 100 - yes
  stakeEth: number;
}
