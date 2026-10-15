/**
 * Price at an exact past moment T (the top of an hour), for the keeper.
 *
 * "Price at T" = the close of the last 1-minute candle that ends at or before
 * T, provided it started no more than FRESH_SECONDS before T. If nothing traded
 * in that window (market closed, halted, thin overnight trading) there is no
 * price, the keeper posts nothing, and that round refunds. Never guesses.
 *
 *  - Crypto: Coinbase Exchange 1-minute candles → Yahoo Finance (fallback)
 *  - Stocks/ETFs: Yahoo Finance 1-minute chart, pre/post-market included
 */

export const FRESH_SECONDS = 6 * 60;
const UA = "Mozilla/5.0 (compatible; StockStakesKeeper/1.0; +https://stockstakes.fun)";
const TIMEOUT_MS = 10_000;

export type Fetch = (url: string) => Promise<unknown>;

export const httpJson: Fetch = async (url) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
};

/** [candle start (unix s), close][], any order. */
export type Candles = Array<[number, number]>;

/** Close of the freshest 1-minute candle ending at or before T, or null. */
export function priceAtFromCandles(candles: Candles, T: number): number | null {
  let best: [number, number] | null = null;
  for (const c of candles) {
    const [start, close] = c;
    if (!Number.isFinite(start) || !Number.isFinite(close) || close <= 0) continue;
    if (start + 60 > T || start < T - FRESH_SECONDS) continue;
    if (!best || start > best[0]) best = c;
  }
  return best ? best[1] : null;
}

export function parseYahooChart(body: unknown): Candles {
  const r = (body as { chart?: { result?: Array<{ timestamp?: unknown; indicators?: { quote?: Array<{ close?: unknown }> } }> } })
    ?.chart?.result?.[0];
  const ts = r?.timestamp;
  const close = r?.indicators?.quote?.[0]?.close;
  if (!Array.isArray(ts) || !Array.isArray(close)) return [];
  const out: Candles = [];
  ts.forEach((t, i) => {
    if (typeof t === "number" && typeof close[i] === "number") out.push([t, close[i] as number]);
  });
  return out;
}

/** Coinbase candles: [time, low, high, open, close, volume][], newest first. */
export function parseCoinbaseCandles(body: unknown): Candles {
  if (!Array.isArray(body)) return [];
  return body
    .filter((c): c is number[] => Array.isArray(c) && typeof c[0] === "number" && typeof c[4] === "number")
    .map((c) => [c[0], c[4]] as [number, number]);
}

export interface Feedable {
  kind: "crypto" | "stock" | "etf";
  feed: { yahoo: string; coinbase?: string };
}

/**
 * Builds a price source that downloads each symbol's recent 1-minute history
 * once per keeper run and answers every hour asked of it from that.
 */
export function createPriceSource(get: Fetch = httpJson) {
  const yahoo = new Map<string, Promise<Candles>>();

  const yahooCandles = (symbol: string) => {
    if (!yahoo.has(symbol)) {
      const p = (async () => {
        for (const host of ["query1", "query2"]) {
          try {
            const c = parseYahooChart(
              await get(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=2d&includePrePost=true`),
            );
            if (c.length) return c;
          } catch {
            // try the other host
          }
        }
        throw new Error(`Yahoo: no data for ${symbol}`);
      })();
      p.catch(() => yahoo.delete(symbol)); // let a retry try again
      yahoo.set(symbol, p);
    }
    return yahoo.get(symbol)!;
  };

  const coinbaseAt = async (product: string, T: number) => {
    const iso = (s: number) => new Date(s * 1000).toISOString();
    const body = await get(
      `https://api.exchange.coinbase.com/products/${encodeURIComponent(product)}/candles?granularity=60&start=${iso(T - FRESH_SECONDS - 60)}&end=${iso(T)}`,
    );
    return priceAtFromCandles(parseCoinbaseCandles(body), T);
  };

  return async function priceAt(m: Feedable, T: number): Promise<number | null> {
    if (m.kind === "crypto" && m.feed.coinbase) {
      try {
        const p = await coinbaseAt(m.feed.coinbase, T);
        if (p !== null) return p;
      } catch {
        // fall back to Yahoo
      }
    }
    return priceAtFromCandles(await yahooCandles(m.feed.yahoo), T);
  };
}
