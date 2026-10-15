import { parseEventLogs, parseUnits, type Address, type Hash, type PublicClient, type WalletClient } from "viem";
import { stakesOracleAbi } from "../../lib/web3/abis.ts";

/**
 * One keeper pass: post every missing hourly price that can still be posted.
 *
 * Idempotent — it reads what is already on-chain first, so running it twice,
 * late, or after missed runs only fills gaps (back to the oracle's deadline).
 */

export interface KeeperMarket {
  id: string;
  key: `0x${string}`;
  kind: "crypto" | "stock" | "etf";
  feed: { yahoo: string; coinbase?: string };
}

export type PriceAt = (m: KeeperMarket, T: number) => Promise<number | null>;

export interface KeeperOptions {
  publicClient: PublicClient;
  walletClient?: WalletClient; // omitted (or dryRun) → read and fetch only
  oracle: Address;
  markets: KeeperMarket[];
  priceAt: PriceAt;
  now?: () => number; // unix seconds
  dryRun?: boolean;
  log?: (msg: string) => void;
  retries?: number;
  retryDelayMs?: number;
  /** Don't post an hour until this many seconds after it, so its last candle is final. */
  settleDelaySeconds?: number;
  batchSize?: number;
}

export interface KeeperResult {
  hours: number[];
  posted: number;
  rejected: { market: string; hour: number; reason: string }[];
  noPrice: { market: string; hour: number }[];
  txs: Hash[];
  failedTxs: { hour: number; error: string }[];
}

const SKIP_REASONS = ["AlreadySet", "BadPrice", "FeedDeviation"];

export async function runKeeper(o: KeeperOptions): Promise<KeeperResult> {
  const log = o.log ?? console.log;
  const now = o.now ? o.now() : Math.floor(Date.now() / 1000);
  const retries = o.retries ?? 3;
  const settle = o.settleDelaySeconds ?? 90;
  const batch = o.batchSize ?? 60;
  const result: KeeperResult = { hours: [], posted: 0, rejected: [], noPrice: [], txs: [], failedTxs: [] };

  const deadline = Number(
    await o.publicClient.readContract({ address: o.oracle, abi: stakesOracleAbi, functionName: "POST_DEADLINE" }),
  );

  // Hours that are over (plus settle delay) and still inside the posting deadline (with 2 min margin for inclusion).
  const current = Math.floor(now / 3600);
  for (let h = current; h >= current - 48; h--) {
    if (h * 3600 + settle <= now && h * 3600 + deadline > now + 120) result.hours.unshift(h);
  }
  if (!result.hours.length) {
    log("Nothing to post yet.");
    return result;
  }

  // What is already posted (or voided)?
  const pairs = result.hours.flatMap((hour) => o.markets.map((m) => ({ hour, m })));
  const states = await readPosted(o, pairs);
  const missing = pairs.filter((_, i) => states[i].finalAt === 0n && !states[i].voided);
  log(`Hours ${result.hours.join(", ")}: ${pairs.length - missing.length} prices already on-chain, ${missing.length} missing.`);

  // Fetch prices (retrying transient source failures).
  const prices = new Map<string, bigint>();
  await pool(missing, 4, async ({ hour, m }) => {
    const p = await withRetry(() => o.priceAt(m, hour * 3600), retries, o.retryDelayMs ?? 1500).catch(() => null);
    if (p === null || !(p > 0)) {
      result.noPrice.push({ market: m.id, hour });
      return;
    }
    prices.set(`${hour}:${m.id}`, parseUnits(p.toFixed(8), 8));
  });

  // Post, one transaction per hour (chunked).
  for (const hour of result.hours) {
    const todo = missing.filter((x) => x.hour === hour && prices.has(`${hour}:${x.m.id}`));
    for (let i = 0; i < todo.length; i += batch) {
      const chunk = todo.slice(i, i + batch);
      const keys = chunk.map((x) => x.m.key);
      const values = chunk.map((x) => prices.get(`${hour}:${x.m.id}`)!);
      if (o.dryRun || !o.walletClient) {
        log(`[dry run] would post ${chunk.length} prices for hour ${hour} (${new Date(hour * 3600_000).toISOString()})`);
        continue;
      }
      try {
        const { request } = await o.publicClient.simulateContract({
          account: o.walletClient.account!,
          address: o.oracle,
          abi: stakesOracleAbi,
          functionName: "post",
          args: [BigInt(hour), keys, values],
        });
        const hash = await o.walletClient.writeContract(request);
        result.txs.push(hash);
        const receipt = await o.publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
        if (receipt.status !== "success") throw new Error(`reverted (${hash})`);
        const byKey = new Map(chunk.map((x) => [x.m.key.toLowerCase(), x.m.id]));
        for (const ev of parseEventLogs({ abi: stakesOracleAbi, logs: receipt.logs })) {
          if (ev.eventName === "PricePosted") result.posted++;
          if (ev.eventName === "PriceSkipped") {
            const reason = SKIP_REASONS[Number(ev.args.reason)] ?? String(ev.args.reason);
            if (reason !== "AlreadySet") {
              result.rejected.push({ market: byKey.get(ev.args.market.toLowerCase()) ?? ev.args.market, hour, reason });
            }
          }
        }
        log(`Posted hour ${hour} (${new Date(hour * 3600_000).toISOString()}): ${chunk.length} prices, tx ${hash}`);
      } catch (err) {
        const msg = (err as Error).message.split("\n")[0];
        result.failedTxs.push({ hour, error: msg });
        log(`! failed to post hour ${hour}: ${msg}`);
      }
    }
  }
  return result;
}

async function readPosted(o: KeeperOptions, pairs: { hour: number; m: KeeperMarket }[]) {
  const calls = pairs.map(({ hour, m }) => ({
    address: o.oracle,
    abi: stakesOracleAbi,
    functionName: "posted" as const,
    args: [m.key, BigInt(hour)] as const,
  }));
  const parse = (r: readonly [bigint, bigint | number, boolean]) => ({ finalAt: BigInt(r[1]), voided: r[2] });
  if (o.publicClient.chain?.contracts?.multicall3) {
    const out = await o.publicClient.multicall({ contracts: calls, allowFailure: false, batchSize: 4096 });
    return (out as unknown as (readonly [bigint, bigint | number, boolean])[]).map(parse);
  }
  const out: ReturnType<typeof parse>[] = [];
  for (let i = 0; i < calls.length; i += 25) {
    const part = await Promise.all(calls.slice(i, i + 25).map((c) => o.publicClient.readContract(c)));
    out.push(...part.map((r) => parse(r as readonly [bigint, bigint | number, boolean])));
  }
  return out;
}

export async function withRetry<T>(fn: () => Promise<T>, retries: number, delayMs: number): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
  throw last;
}

async function pool<T>(items: T[], n: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
}
