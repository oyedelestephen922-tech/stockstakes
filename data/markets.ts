import type { Market } from "@/lib/types";

/**
 * Markets listed in each round.
 * Prices are intentionally null — no demo prices are shown. Connect a price
 * API / oracle in `getMarkets()` and fill `price`, `hourlyChangePct` and
 * `history`; the cards will render them automatically.
 */
export const markets: Market[] = [
  {
    id: "nvda",
    symbol: "NVDA",
    name: "NVIDIA",
    pair: "NVDA / USD",
    category: "Technology",
    price: null,
    hourlyChangePct: null,
    history: [],
    question: "Will NVIDIA finish higher this hour?",
    source: "demo",
  },
  {
    id: "googl",
    symbol: "GOOGL",
    name: "Alphabet",
    pair: "GOOGL / USD",
    category: "Technology",
    price: null,
    hourlyChangePct: null,
    history: [],
    question: "Will Alphabet finish higher this hour?",
    source: "demo",
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    pair: "ETH / USD",
    category: "Crypto",
    price: null,
    hourlyChangePct: null,
    history: [],
    question: "Will ETH finish higher this hour?",
    source: "demo",
  },
];

export function getMarkets(): Market[] {
  return markets;
}

export function getMarket(id: string): Market | undefined {
  return markets.find((m) => m.id === id);
}
