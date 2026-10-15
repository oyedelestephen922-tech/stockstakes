import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { getAddress, parseEther } from "viem";
import { runKeeper, type KeeperMarket } from "../keeper/keeper.ts";
import { createPriceSource, parseCoinbaseCandles, parseYahooChart, priceAtFromCandles } from "../keeper/prices.ts";
import { marketKey } from "../config/markets.ts";

const H = 3600;
const OUTCOME = ["Unsettled", "Up", "Down", "Refund"];

function market(id: string): KeeperMarket {
  return { id, key: marketKey(id), kind: "stock", feed: { yahoo: id.toUpperCase() } };
}

describe("keeper (fake prices, local chain)", async function () {
  const { viem, networkHelpers } = await network.create();
  const publicClient = await viem.getPublicClient();
  const [owner, keeper, alice, bob] = await viem.getWalletClients();

  // Start in the middle of an hour, well clear of boundaries.
  const h0 = Math.floor((await networkHelpers.time.latest()) / H) + 10;
  await networkHelpers.time.increaseTo(h0 * H + 600);

  const oracle = await viem.deployContract("StakesOracle", [
    owner.account.address, keeper.account.address, owner.account.address, 3600n, 6n * 3600n, 300, 26 * 3600,
  ]);
  const rounds = await viem.deployContract("StakesRounds", [
    owner.account.address, oracle.address, 300, 60, parseEther("0.001"), parseEther("1"),
  ]);

  const up = market("up"), down = market("down"), flat = market("flat"), gap = market("gap"), far = market("far");
  const markets = [up, down, flat, gap, far];
  await rounds.write.listMarkets([markets.map((m) => m.key), true]);

  // "far" has a Chainlink feed at 50 while the keeper will report 100 → rejected by the sanity check.
  const feed = await viem.deployContract("MockAggregator", [8, 50n * 10n ** 8n]);
  await oracle.write.setFeeds([[far.key], [feed.address]]);

  const r = h0 + 1; // the round open now
  for (const m of markets) {
    await rounds.write.enter([BigInt(r), m.key, 8000], { account: alice.account, value: parseEther("0.5") });
    await rounds.write.enter([BigInt(r), m.key, 3000], { account: bob.account, value: parseEther("0.5") });
  }

  // Fake price table: up rises, down falls, flat stays, gap never has a price.
  const table: Record<string, Record<number, number>> = {
    up: { [r * H]: 100, [(r + 1) * H]: 101.5 },
    down: { [r * H]: 100, [(r + 1) * H]: 98.25 },
    flat: { [r * H]: 100, [(r + 1) * H]: 100 },
    far: { [r * H]: 100, [(r + 1) * H]: 100 },
  };
  let upFailures = 2; // the first two fetches of up's start price fail, to exercise retries
  const calls: string[] = [];
  const priceAt = async (m: KeeperMarket, T: number) => {
    calls.push(`${m.id}@${T}`);
    if (m.id === "up" && T === r * H && upFailures-- > 0) throw new Error("source blip");
    return table[m.id]?.[T] ?? null;
  };
  const run = (now: number) =>
    runKeeper({ publicClient, walletClient: keeper, oracle: oracle.address, markets, priceAt, now: () => now, retryDelayMs: 1, log: () => {} });

  const outcome = async (m: KeeperMarket) => OUTCOME[await rounds.read.outcomeOf([BigInt(r), m.key])];

  it("does not post an hour before its settle delay has passed", async function () {
    await networkHelpers.time.increaseTo(r * H + 30);
    const res = await run(r * H + 30);
    assert.ok(!res.hours.includes(r));
  });

  it("posts the round's start prices, retrying a failing source", async function () {
    await networkHelpers.time.increaseTo(r * H + 120);
    const res = await run(r * H + 120);
    assert.ok(res.hours.includes(r));
    assert.equal(res.failedTxs.length, 0);
    assert.equal(res.posted, 3, "up, down, flat posted for hour r");
    assert.deepEqual(res.rejected, [{ market: "far", hour: r, reason: "FeedDeviation" }]);
    assert.ok(res.noPrice.some((x) => x.market === "gap" && x.hour === r));
    assert.equal(calls.filter((c) => c === `up@${r * H}`).length, 3, "2 failures + 1 success");
    const [price] = await oracle.read.posted([up.key, BigInt(r)]);
    assert.equal(price, 100n * 10n ** 8n);
  });

  it("is idempotent: a second run posts nothing new", async function () {
    const res = await run(r * H + 130);
    assert.equal(res.posted, 0);
    assert.equal(res.txs.length, 1, "only the retry for the rejected market is sent");
    assert.equal(res.rejected.length, 1);
  });

  it("catches up an hour whose run was missed", async function () {
    // no run at (r+1):00 — the next one happens 2h late
    const t = (r + 1) * H + 2 * H;
    await networkHelpers.time.increaseTo(t);
    const res = await run(t);
    assert.equal(res.posted, 3, "end prices for hour r+1");
    const [price] = await oracle.read.posted([down.key, BigInt(r + 1)]);
    assert.equal(price, 9825n * 10n ** 6n);
  });

  it("settles UP, DOWN and refund rounds correctly", async function () {
    await networkHelpers.time.increaseTo((r + 1) * H + 3 * H + 10); // past the challenge window
    assert.equal(await outcome(up), "Up");
    assert.equal(await outcome(down), "Down");
    assert.equal(await outcome(flat), "Refund");
    assert.equal(await outcome(far), "Unsettled", "missing prices stay pending until the 6h deadline");

    await networkHelpers.time.increaseTo(r * H + 6 * H + 10); // past the start price's deadline
    assert.equal(await outcome(far), "Refund", "rejected price → never posted → void after deadline");
    assert.equal(await outcome(gap), "Refund", "missing price → void after deadline");

    // alice (80% YES) beats bob on UP, loses to him on DOWN; refunds return stakes exactly
    const [, aliceUp] = await rounds.read.claimable([BigInt(r), up.key, alice.account.address]);
    const [, bobUp] = await rounds.read.claimable([BigInt(r), up.key, bob.account.address]);
    assert.ok(aliceUp > parseEther("0.5") && bobUp < parseEther("0.5"));
    const [, aliceDown] = await rounds.read.claimable([BigInt(r), down.key, alice.account.address]);
    assert.ok(aliceDown < parseEther("0.5"));
    for (const m of [flat, gap, far]) {
      const [, refund] = await rounds.read.claimable([BigInt(r), m.key, alice.account.address]);
      assert.equal(refund, parseEther("0.5"));
    }

    await viem.assertions.balancesHaveChanged(
      rounds.write.claimMany([[BigInt(r), BigInt(r)], [up.key, gap.key]], { account: alice.account }),
      [{ address: getAddress(alice.account.address), amount: aliceUp + parseEther("0.5") }],
    );
  });
});

describe("keeper price source (fake HTTP)", function () {
  const T = 1_800_000_000; // an hour boundary

  it("takes the freshest 1-minute candle that ended by T, and nothing stale", function () {
    const candles: [number, number][] = [
      [T - 600, 1], // too old (started > 6 min before T)
      [T - 300, 2],
      [T - 60, 3], // ends exactly at T → the one we want
      [T, 4], // ends after T → excluded
    ];
    assert.equal(priceAtFromCandles(candles, T), 3);
    assert.equal(priceAtFromCandles([[T - 600, 1]], T), null);
    assert.equal(priceAtFromCandles([], T), null);
  });

  it("parses Yahoo and Coinbase shapes", function () {
    const yahoo = { chart: { result: [{ timestamp: [T - 120, T - 60], indicators: { quote: [{ close: [10, null] }] } }] } };
    assert.deepEqual(parseYahooChart(yahoo), [[T - 120, 10]]);
    assert.deepEqual(parseCoinbaseCandles([[T - 60, 1, 2, 1.5, 1.8, 9]]), [[T - 60, 1.8]]);
    assert.deepEqual(parseYahooChart({ chart: { result: null } }), []);
  });

  it("falls back from Coinbase to Yahoo, and from query1 to query2", async function () {
    const seen: string[] = [];
    const get = async (url: string) => {
      seen.push(new URL(url).host);
      if (url.includes("coinbase")) throw new Error("down");
      if (url.includes("query1")) throw new Error("429");
      return { chart: { result: [{ timestamp: [T - 60], indicators: { quote: [{ close: [2500.5] }] } }] } };
    };
    const priceAt = createPriceSource(get);
    const eth = { kind: "crypto" as const, feed: { yahoo: "ETH-USD", coinbase: "ETH-USD" } };
    assert.equal(await priceAt(eth, T), 2500.5);
    assert.deepEqual(seen, ["api.exchange.coinbase.com", "query1.finance.yahoo.com", "query2.finance.yahoo.com"]);
  });

  it("downloads each stock once per run, however many hours are asked", async function () {
    let n = 0;
    const get = async () => {
      n++;
      return { chart: { result: [{ timestamp: [T - 60, T + H - 60], indicators: { quote: [{ close: [1, 2] }] } }] } };
    };
    const priceAt = createPriceSource(get);
    const nvda = { kind: "stock" as const, feed: { yahoo: "NVDA" } };
    assert.equal(await priceAt(nvda, T), 1);
    assert.equal(await priceAt(nvda, T + H), 2);
    assert.equal(n, 1);
  });
});
