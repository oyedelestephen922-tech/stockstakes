import "server-only";
import type { LiveQuote, Market } from "@/lib/types";

/**
 * Live price feed (server only).
 *
 * Sources, tried in order:
 *  - Stocks: Finnhub (if FINNHUB_API_KEY is set) → Yahoo Finance chart API
 *  - Crypto: Coinbase Exchange public candles → Yahoo Finance chart API
 *
 * A source that fails or returns nothing is skipped. If every source fails the
 * market gets `null` and the UI shows no price — values are never invented.
 */

const UA = "Mozilla/5.0 (compatible; StockStakes/1.0; +https://stockstakes.fun)";
const TIMEOUT_MS = 6000;
const HOUR_S = 3600;

async function getJson(url: string, init?: RequestInit): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": UA, Accept: "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

const isNum = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

function pctChange(from: number, to: number): number | null {
  return from > 0 ? ((to - from) / from) * 100 : null;
}

/** Given ascending [unixSeconds, close] points, find the % change over the last hour. */
function hourChange(points: [number, number][]): number | null {
  if (points.length < 2) return null;
  const [lastT, lastC] = points[points.length - 1];
  const target = lastT - HOUR_S;
  let ref: [number, number] | undefined;
  for (const p of points) {
    if (p[0] <= target) ref = p;
    else break;
  }
  return ref ? pctChange(ref[1], lastC) : null;
}

// ---------------------------------------------------------------- Yahoo
interface YahooChart {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        currentTradingPeriod?: { regular?: { start?: number; end?: number } };
        instrumentType?: string;
      };
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: (number | null)[] }> };
    }>;
  };
}

async function fromYahoo(symbol: string, crypto: boolean): Promise<LiveQuote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d&includePrePost=false`;
  const data = (await getJson(url)) as YahooChart;
  const r = data.chart?.result?.[0];
  const ts = r?.timestamp ?? [];
  const closes = r?.indicators?.quote?.[0]?.close ?? [];
  const points: [number, number][] = [];
  ts.forEach((t, i) => {
    const c = closes[i];
    if (isNum(t) && isNum(c)) points.push([t, c]);
  });
  const price = isNum(r?.meta?.regularMarketPrice) ? r!.meta!.regularMarketPrice! : points.at(-1)?.[1];
  if (!isNum(price)) return null;

  const now = Date.now() / 1000;
  const reg = r?.meta?.currentTradingPeriod?.regular;
  const marketState: LiveQuote["marketState"] = crypto
    ? "24h"
    : isNum(reg?.start) && isNum(reg?.end) && now >= reg!.start! && now < reg!.end!
      ? "open"
      : "closed";

  return {
    price,
    changePct: hourChange(points),
    changeWindow: "1h",
    history: points.slice(-24).map((p) => p[1]),
    marketState,
    provider: "Yahoo Finance",
  };
}

// ---------------------------------------------------------------- Coinbase
async function fromCoinbase(product: string): Promise<LiveQuote | null> {
  // [time, low, high, open, close, volume], newest first, 5-minute candles
  const data = (await getJson(
    `https://api.exchange.coinbase.com/products/${encodeURIComponent(product)}/candles?granularity=300`,
  )) as number[][];
  if (!Array.isArray(data) || data.length === 0) return null;
  const points = data
    .filter((c) => Array.isArray(c) && isNum(c[0]) && isNum(c[4]))
    .map((c) => [c[0], c[4]] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  const price = points.at(-1)?.[1];
  if (!isNum(price)) return null;
  return {
    price,
    changePct: hourChange(points),
    changeWindow: "1h",
    history: points.slice(-24).map((p) => p[1]),
    marketState: "24h",
    provider: "Coinbase",
  };
}

// ---------------------------------------------------------------- Finnhub
async function fromFinnhub(symbol: string, key: string): Promise<LiveQuote | null> {
  const q = (await getJson(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(key)}`,
  )) as { c?: number; dp?: number; t?: number };
  if (!isNum(q.c) || q.c <= 0) return null;
  // The free quote endpoint has no intraday candles, so the change is daily.
  const fresh = isNum(q.t) && Date.now() / 1000 - q.t < 15 * 60;
  return {
    price: q.c,
    changePct: isNum(q.dp) ? q.dp : null,
    changeWindow: "1d",
    history: [],
    marketState: fresh ? "open" : "closed",
    provider: "Finnhub",
  };
}

async function firstOk(attempts: Array<() => Promise<LiveQuote | null>>): Promise<LiveQuote | null> {
  for (const attempt of attempts) {
    try {
      const q = await attempt();
      if (q) return q;
    } catch {
      // try the next source
    }
  }
  return null;
}

export async function getQuote(market: Market): Promise<LiveQuote | null> {
  const crypto = market.category === "Crypto";
  const attempts: Array<() => Promise<LiveQuote | null>> = [];
  const finnhubKey = process.env.FINNHUB_API_KEY;

  if (crypto && market.feed.coinbase) attempts.push(() => fromCoinbase(market.feed.coinbase!));
  if (!crypto && finnhubKey && market.feed.finnhub) {
    // Prefer Yahoo for its intraday history, fall back to Finnhub.
    attempts.push(() => fromYahoo(market.feed.yahoo, false));
    attempts.push(() => fromFinnhub(market.feed.finnhub!, finnhubKey));
  } else {
    attempts.push(() => fromYahoo(market.feed.yahoo, crypto));
  }
  return firstOk(attempts);
}

export async function getQuotes(list: Market[]): Promise<Record<string, LiveQuote | null>> {
  const entries = await Promise.all(list.map(async (m) => [m.id, await getQuote(m)] as const));
  return Object.fromEntries(entries);
}
