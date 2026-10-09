import type { LiveQuote, Market, MarketCategory } from "@/lib/types";

/**
 * Markets listed in each round. Add or remove a line here to change the board —
 * the round, prediction cards, stake panel and price feed all pick it up.
 *
 * Prices are filled live from /api/prices (see lib/prices.ts). Until the first
 * response arrives — or if every price source fails — `price` stays null and
 * the UI shows no price at all. No demo prices are ever used.
 */
interface MarketDef {
  id: string;
  symbol: string;
  name: string; // full name shown on cards
  short?: string; // name used in the question, defaults to `name`
  category: MarketCategory;
  feed: Market["feed"];
}

const defs: MarketDef[] = [
  { id: "eth", symbol: "ETH", name: "Ethereum", short: "ETH", category: "Crypto", feed: { yahoo: "ETH-USD", coinbase: "ETH-USD" } },
  { id: "nvda", symbol: "NVDA", name: "NVIDIA", category: "Technology", feed: { yahoo: "NVDA", finnhub: "NVDA" } },
  { id: "tsla", symbol: "TSLA", name: "Tesla", category: "Consumer", feed: { yahoo: "TSLA", finnhub: "TSLA" } },
  { id: "spcx", symbol: "SPCX", name: "SpaceX", category: "Aerospace", feed: { yahoo: "SPCX", finnhub: "SPCX" } },
  { id: "aapl", symbol: "AAPL", name: "Apple", category: "Technology", feed: { yahoo: "AAPL", finnhub: "AAPL" } },
  { id: "googl", symbol: "GOOGL", name: "Alphabet", category: "Technology", feed: { yahoo: "GOOGL", finnhub: "GOOGL" } },
  { id: "mstr", symbol: "MSTR", name: "Strategy", category: "Finance", feed: { yahoo: "MSTR", finnhub: "MSTR" } },
  { id: "gme", symbol: "GME", name: "GameStop", category: "Consumer", feed: { yahoo: "GME", finnhub: "GME" } },
  { id: "rddt", symbol: "RDDT", name: "Reddit", category: "Technology", feed: { yahoo: "RDDT", finnhub: "RDDT" } },
  { id: "hims", symbol: "HIMS", name: "Hims & Hers", category: "Healthcare", feed: { yahoo: "HIMS", finnhub: "HIMS" } },
  { id: "lly", symbol: "LLY", name: "Eli Lilly", category: "Healthcare", feed: { yahoo: "LLY", finnhub: "LLY" } },
  { id: "ttwo", symbol: "TTWO", name: "Take-Two", category: "Entertainment", feed: { yahoo: "TTWO", finnhub: "TTWO" } },
  { id: "qqq", symbol: "QQQ", name: "Invesco QQQ", short: "QQQ", category: "ETF", feed: { yahoo: "QQQ", finnhub: "QQQ" } },
  { id: "slv", symbol: "SLV", name: "iShares Silver Trust", short: "Silver (SLV)", category: "ETF", feed: { yahoo: "SLV", finnhub: "SLV" } },
];

export const markets: Market[] = defs.map((d) => ({
  id: d.id,
  symbol: d.symbol,
  name: d.name,
  pair: `${d.symbol} / USD`,
  category: d.category,
  price: null,
  changePct: null,
  changeWindow: "1h",
  history: [],
  marketState: null,
  feed: d.feed,
  question: `Will ${d.short ?? d.name} finish higher this hour?`,
  source: "api",
}));

/** Categories in board order, for filter chips. */
export const marketCategories: MarketCategory[] = Array.from(new Set(markets.map((m) => m.category)));

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
