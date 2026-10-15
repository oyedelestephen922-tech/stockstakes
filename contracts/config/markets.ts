import { stringToHex, type Hex } from "viem";
import { markets } from "../../data/markets.ts";

/**
 * On-chain market key: the site's market id (e.g. "nvda") as a left-aligned
 * bytes32 — the same value as Solidity's `bytes32("nvda")`. Keys are stable
 * when markets are reordered or added in data/markets.ts.
 */
export function marketKey(id: string): Hex {
  return stringToHex(id, { size: 32 });
}

export interface BoardMarket {
  id: string;
  symbol: string;
  kind: "crypto" | "stock" | "etf";
  key: Hex;
  feed: { yahoo: string; finnhub?: string; coinbase?: string };
}

/** Every market on the site's board (data/markets.ts is the single source of truth). */
export const boardMarkets: BoardMarket[] = markets.map((m) => ({
  id: m.id,
  symbol: m.symbol,
  kind: m.kind,
  key: marketKey(m.id),
  feed: m.feed,
}));
