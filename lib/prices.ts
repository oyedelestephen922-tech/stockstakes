import "server-only";
import type { LiveQuote, Market } from "@/lib/types";

/**
 * Live price feed (server only).
 *
 *  - ETH:     Coinbase Exchange public candles → Yahoo Finance chart (fallback)
 *  - Stocks:  Yahoo Finance spark, batched 20 symbols per request
 *             → Yahoo Finance chart per symbol for anything the batch missed
 *             → Finnhub quote (if FINNHUB_API_KEY is set) for anything still missing
 *
 * Results are cached in memory for CACHE_MS so many visitors share one upstream
 * round-trip. A market whose every source fails gets `null` and the UI shows no
 * price — values are never invented.
 */

const UA = "Mozilla/5.0 (compatible; StockStakes/1.0; +https://stockstakes.fun)";
const TIMEOUT_MS = 7000;
const HOUR_S = 3600;
const BATCH = 20;
const FALLBACK_CONCURRENCY = 5;
const MAX_CHART_FALLBACKS = 40; // per refresh, so a failing batch can't trigger 100+ calls
const MAX_FINNHUB_FALLBACKS = 25; // free tier allows 60 calls/minute
const CACHE_MS = 25_000;

type Point = [number, number]; // [unix seconds, close]

async function getJson(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
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

/** % change over the last hour from ascending points. */
function hourChange(points: Point[]): number | null {
  if (points.length < 2) return null;
  const [lastT, lastC] = points[points.length - 1];
  const target = lastT - HOUR_S;
  let ref: Point | undefined;
  for (const p of points) {
    if (p[0] <= target) ref = p;
    else break;
  }
  return ref ? pctChange(ref[1], lastC) : null;
}

function toPoints(ts: unknown, closes: unknown): Point[] {
  if (!Array.isArray(ts) || !Array.isArray(closes)) return [];
  const pts: Point[] = [];
  ts.forEach((t, i) => {
    const c = closes[i];
    if (isNum(t) && isNum(c)) pts.push([t, c]);
  });
  return pts.sort((a, b) => a[0] - b[0]);
}

/** Regular US session: Mon–Fri 9:30–16:00 America/New_York (exchange holidays not modelled). */
export function usMarketOpen(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = get("weekday");
  if (day === "Sat" || day === "Sun") return false;
  const mins = Number(get("hour")) * 60 + Number(get("minute"));
  return mins >= 9 * 60 + 30 && mins < 16 * 60;
}

function quoteFrom(points: Point[], price: number | undefined, marketState: LiveQuote["marketState"], provider: string): LiveQuote | null {
  const p = isNum(price) ? price : points.at(-1)?.[1];
  if (!isNum(p)) return null;
  return {
    price: p,
    changePct: hourChange(points),
    changeWindow: "1h",
    history: points.slice(-24).map((x) => x[1]),
    marketState,
    provider,
  };
}

// ---------------------------------------------------------------- Yahoo spark (batched)
/** Accepts both known spark shapes: v8 `{SYM: {timestamp, close}}` and v7 `{spark: {result: [{symbol, response: [chart]}]}}`. */
export function parseSpark(body: unknown): Record<string, Point[]> {
  const out: Record<string, Point[]> = {};
  if (!body || typeof body !== "object") return out;
  const b = body as Record<string, unknown>;
  const v7 = (b.spark as { result?: unknown } | undefined)?.result;
  if (Array.isArray(v7)) {
    for (const r of v7 as Array<{ symbol?: string; response?: Array<{ timestamp?: unknown; indicators?: { quote?: Array<{ close?: unknown }> } }> }>) {
      const res = r.response?.[0];
      if (r.symbol && res) out[r.symbol.toUpperCase()] = toPoints(res.timestamp, res.indicators?.quote?.[0]?.close);
    }
    return out;
  }
  for (const [sym, v] of Object.entries(b)) {
    if (v && typeof v === "object" && "close" in v) {
      const o = v as { timestamp?: unknown; close?: unknown };
      out[sym.toUpperCase()] = toPoints(o.timestamp, o.close);
    }
  }
  return out;
}

async function yahooSpark(symbols: string[]): Promise<Record<string, Point[]>> {
  const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbols.map(encodeURIComponent).join(",")}&range=1d&interval=5m`;
  return parseSpark(await getJson(url));
}

// ---------------------------------------------------------------- Yahoo chart (single)
interface YahooChart {
  chart?: {
    result?: Array<{
      meta?: { regularMarketPrice?: number; currentTradingPeriod?: { regular?: { start?: number; end?: number } } };
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: (number | null)[] }> };
    }>;
  };
}

async function yahooChart(symbol: string, crypto: boolean): Promise<LiveQuote | null> {
  const data = (await getJson(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d&includePrePost=false`,
  )) as YahooChart;
  const r = data.chart?.result?.[0];
  const points = toPoints(r?.timestamp, r?.indicators?.quote?.[0]?.close);
  const now = Date.now() / 1000;
  const reg = r?.meta?.currentTradingPeriod?.regular;
  const state: LiveQuote["marketState"] = crypto
    ? "24h"
    : isNum(reg?.start) && isNum(reg?.end)
      ? now >= reg!.start! && now < reg!.end!
        ? "open"
        : "closed"
      : usMarketOpen()
        ? "open"
        : "closed";
  return quoteFrom(points, r?.meta?.regularMarketPrice, state, "Yahoo Finance");
}

// ---------------------------------------------------------------- Coinbase
async function coinbase(product: string): Promise<LiveQuote | null> {
  // [time, low, high, open, close, volume], newest first, 5-minute candles
  const data = (await getJson(`https://api.exchange.coinbase.com/products/${encodeURIComponent(product)}/candles?granularity=300`)) as number[][];
  if (!Array.isArray(data)) return null;
  const points = data.filter((c) => Array.isArray(c) && isNum(c[0]) && isNum(c[4])).map((c) => [c[0], c[4]] as Point);
  return quoteFrom(points.sort((a, b) => a[0] - b[0]), undefined, "24h", "Coinbase");
}

// ---------------------------------------------------------------- Finnhub
async function finnhub(symbol: string, key: string): Promise<LiveQuote | null> {
  const q = (await getJson(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(key)}`,
  )) as { c?: number; dp?: number };
  if (!isNum(q.c) || q.c <= 0) return null;
  // The free quote endpoint has no intraday candles, so the change is daily.
  return {
    price: q.c,
    changePct: isNum(q.dp) ? q.dp : null,
    changeWindow: "1d",
    history: [],
    marketState: usMarketOpen() ? "open" : "closed",
    provider: "Finnhub",
  };
}

async function safe<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch {
    return null;
  }
}

async function pool<T>(items: T[], n: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
}

async function fetchQuotes(list: Market[]): Promise<Record<string, LiveQuote | null>> {
  const out: Record<string, LiveQuote | null> = Object.fromEntries(list.map((m) => [m.id, null]));
  const crypto = list.filter((m) => m.kind === "crypto");
  const stocks = list.filter((m) => m.kind !== "crypto");

  // 1. Crypto: Coinbase, then Yahoo chart.
  await Promise.all(
    crypto.map(async (m) => {
      out[m.id] =
        (m.feed.coinbase ? await safe(coinbase(m.feed.coinbase)) : null) ?? (await safe(yahooChart(m.feed.yahoo, true)));
    }),
  );

  // 2. Stocks: batched Yahoo spark.
  const state: LiveQuote["marketState"] = usMarketOpen() ? "open" : "closed";
  const chunks: Market[][] = [];
  for (let i = 0; i < stocks.length; i += BATCH) chunks.push(stocks.slice(i, i + BATCH));
  await Promise.all(
    chunks.map(async (chunk) => {
      const series = await safe(yahooSpark(chunk.map((m) => m.feed.yahoo)));
      if (!series) return;
      for (const m of chunk) {
        const pts = series[m.feed.yahoo.toUpperCase()];
        if (pts?.length) out[m.id] = quoteFrom(pts, undefined, state, "Yahoo Finance");
      }
    }),
  );

  // 3. Anything missing: Yahoo chart per symbol (capped).
  const missing = stocks.filter((m) => !out[m.id]).slice(0, MAX_CHART_FALLBACKS);
  await pool(missing, FALLBACK_CONCURRENCY, async (m) => {
    out[m.id] = await safe(yahooChart(m.feed.yahoo, false));
  });

  // 4. Still missing: Finnhub, if a key is configured (capped for the free tier).
  const key = process.env.FINNHUB_API_KEY;
  if (key) {
    const still = stocks.filter((m) => !out[m.id] && m.feed.finnhub).slice(0, MAX_FINNHUB_FALLBACKS);
    await pool(still, FALLBACK_CONCURRENCY, async (m) => {
      out[m.id] = await safe(finnhub(m.feed.finnhub!, key));
    });
  }
  return out;
}

// ---------------------------------------------------------------- cache
let cache: { at: number; data: Record<string, LiveQuote | null> } | null = null;
let inflight: Promise<Record<string, LiveQuote | null>> | null = null;

export async function getQuotes(list: Market[]): Promise<Record<string, LiveQuote | null>> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  if (!inflight) {
    inflight = fetchQuotes(list)
      .then((data) => {
        // Keep the last good quote for a market whose sources all blipped this round.
        const merged = { ...data };
        if (cache) for (const [id, q] of Object.entries(merged)) if (!q && cache.data[id]) merged[id] = cache.data[id];
        cache = { at: Date.now(), data: merged };
        return merged;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Test hook: clear the in-memory cache. */
export function __resetPriceCache() {
  cache = null;
  inflight = null;
}
