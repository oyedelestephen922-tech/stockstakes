/**
 * Shared domain types. Mock data in /data conforms to these shapes, so a real
 * API, oracle or contract reader can replace it without touching components.
 */

export type MarketCategory =
  | "Crypto"
  | "Technology"
  | "Consumer"
  | "Aerospace"
  | "Healthcare"
  | "Finance"
  | "Entertainment"
  | "ETF";

/** Data provenance — every number on screen says where it came from. */
export type DataSource = "demo" | "api" | "oracle";

export type RoundStatus = "prelaunch" | "open" | "closed" | "settling" | "settled";

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

/** Over what window a price change is measured. */
export type ChangeWindow = "1h" | "1d";

/** Live quote returned by /api/prices. */
export interface LiveQuote {
  price: number;
  changePct: number | null;
  changeWindow: ChangeWindow;
  history: number[];
  /** "open" / "closed" for stocks; crypto trades 24/7. */
  marketState: "open" | "closed" | "24h";
  provider: string;
}

export interface Market {
  id: string;
  symbol: string; // e.g. "NVDA"
  name: string; // e.g. "NVIDIA"
  pair: string; // e.g. "NVDA / USD"
  category: MarketCategory;
  /** Live price from /api/prices. null until it loads or if every source fails — the UI then shows nothing. */
  price: number | null;
  changePct: number | null;
  changeWindow: ChangeWindow;
  /** Recent price points for a sparkline, oldest first. */
  history: number[];
  marketState: LiveQuote["marketState"] | null;
  /** Symbols used by the price feed. */
  feed: { yahoo: string; finnhub?: string; coinbase?: string };
  question: string;
  source: DataSource;
}

export interface RoundMarketState {
  marketId: string;
  /** Average YES probability across all entries (0–100). null until the round contract is live. */
  crowdYes: number | null;
  /** Total ETH staked on this market this round. null until the round contract is live. */
  poolEth: number | null;
  entries: number | null;
}

export interface Round {
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
