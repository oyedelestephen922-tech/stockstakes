import type { LiveQuote, Market } from "@/lib/types";

/**
 * Markets listed in each round.
 *
 * Prices are filled live from /api/prices (see lib/prices.ts). Until the first
 * response arrives — or if every price source fails — `price` stays null and
 * the UI shows no price at all. No demo prices are ever used.
 */
export const markets: Market[] = [
  {
    id: "nvda",
    symbol: "NVDA",
    name: "NVIDIA",
    pair: "NVDA / USD",
    category: "Technology",
    price: null,
    changePct: null,
    changeWindow: "1h",
    history: [],
    marketState: null,
    feed: { yahoo: "NVDA", finnhub: "NVDA" },
    question: "Will NVIDIA finish higher this hour?",
    source: "api",
  },
  {
    id: "googl",
    symbol: "GOOGL",
    name: "Alphabet",
    pair: "GOOGL / USD",
    category: "Technology",
    price: null,
    changePct: null,
    changeWindow: "1h",
    history: [],
    marketState: null,
    feed: { yahoo: "GOOGL", finnhub: "GOOGL" },
    question: "Will Alphabet finish higher this hour?",
    source: "api",
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    pair: "ETH / USD",
    category: "Crypto",
    price: null,
    changePct: null,
    changeWindow: "1h",
    history: [],
    marketState: null,
    feed: { yahoo: "ETH-USD", coinbase: "ETH-USD" },
    question: "Will ETH finish higher this hour?",
    source: "api",
  },
];

export function getMarkets(): Market[] {
  return markets;
}

export function getMarket(id: string): Market | undefined {
  return markets.find((m) => m.id === id);
}

/** Merge live quotes into the market list. Markets without a quote keep price null. */
export function withQuotes(list: Market[], quotes: Record<string, LiveQuote | null>): Market[] {
  return list.map((m) => {
    const q = quotes[m.id];
    if (!q) return m;
    return {
      ...m,
      price: q.price,
      changePct: q.changePct,
      changeWindow: q.changeWindow,
      history: q.history,
      marketState: q.marketState,
    };
  });
}
