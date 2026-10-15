/**
 * Deploy, configure and verify StakesOracle + StakesRounds.
 *
 *   npm run deploy            → Robinhood Chain mainnet (4663)
 *   npm run deploy:testnet    → Robinhood Chain testnet (46630)
 *
 * Safe to re-run: every step first checks what is already on-chain and in
 * deployments/<chainId>.json, so an interrupted run picks up where it stopped
 * and never deploys or pays twice. A deployment transaction that was sent but
 * not confirmed is recorded and awaited on the next run instead of re-sent.
 *
 * Writes deployments/<chainId>.json plus the site files lib/web3/deployment.ts
 * and lib/web3/abis.ts — commit them so the site picks up the addresses.
 */
import hre, { network } from "hardhat";
import { verifyContract } from "@nomicfoundation/hardhat-verify/verify";
import { createInterface } from "node:readline/promises";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { getAddress, isAddress, parseAbi, parseEther, type Address, type Hash, type Hex } from "viem";
import { privateKeyToAddress } from "viem/accounts";
import { boardMarkets } from "../config/markets.ts";
import { chainlinkFeeds } from "../config/chainlink.ts";
import { params } from "../config/params.ts";
import { exportSiteFiles } from "./export-site.ts";

const LIVE_CHAINS: Record<number, string> = { 4663: "Robinhood Chain", 46630: "Robinhood Chain Testnet" };
const CHUNK = 40;

interface ContractRecord {
  address?: Address;
  pendingTx?: Hash;
  block?: number;
  constructorArgs?: unknown[];
  verified?: boolean;
}

interface DeploymentState {
  chainId: number;
  network: string;
  deployer: Address;
  owner: Address;
  keeper: Address;
  guardian: Address;
  params: typeof params;
  StakesOracle: ContractRecord;
  StakesRounds: ContractRecord;
  updatedAt: string;
}

const conn = await network.create();
const { viem, networkName, networkConfig } = conn;
const publicClient = await viem.getPublicClient();
const wallets = await viem.getWalletClients();
const deployer = getAddress(wallets[0].account.address);
const chainId = await publicClient.getChainId();
const simulated = networkConfig.type === "edr-simulated" || networkName === "localhost";

if (!simulated && !LIVE_CHAINS[chainId]) {
  throw new Error(`Refusing to deploy: chain ${chainId} is not Robinhood Chain (4663) or its testnet (46630).`);
}

// ------------------------------------------------------------------ roles
function addressFromEnv(name: string, fallback: Address | undefined): Address {
  const v = process.env[name]?.trim();
  if (!v) {
    if (fallback) return fallback;
    throw new Error(`${name} is not set. Add it (or KEEPER_PRIVATE_KEY for the keeper) to contracts/.env.`);
  }
  if (!isAddress(v)) throw new Error(`${name} is not a valid address: ${v}`);
  return getAddress(v);
}

const owner = addressFromEnv("OWNER_ADDRESS", deployer);
function keeperFromKey(): Address | undefined {
  const k = process.env.KEEPER_PRIVATE_KEY?.trim();
  if (!k) return undefined;
  try {
    return privateKeyToAddress((k.startsWith("0x") ? k : `0x${k}`) as Hex);
  } catch {
    throw new Error("KEEPER_PRIVATE_KEY in contracts/.env is not a valid private key.");
  }
}
const keeperKeyAddress = simulated ? undefined : keeperFromKey();
const keeper = addressFromEnv(
  "KEEPER_ADDRESS",
  keeperKeyAddress ?? (simulated && wallets[1] ? getAddress(wallets[1].account.address) : undefined),
);
if (keeperKeyAddress && keeper !== keeperKeyAddress) {
  throw new Error(`KEEPER_ADDRESS (${keeper}) does not match KEEPER_PRIVATE_KEY (${keeperKeyAddress}). Fix one of them in contracts/.env.`);
}
const guardian = addressFromEnv("GUARDIAN_ADDRESS", deployer);
if (!simulated && keeper === deployer) {
  throw new Error("KEEPER_ADDRESS must be a separate wallet from the deployer (its key goes into GitHub).");
}

// ------------------------------------------------------------------ state
const stateDir = new URL("../deployments/", import.meta.url);
const stateFile = new URL(simulated ? `local-${chainId}.json` : `${chainId}.json`, stateDir);
mkdirSync(stateDir, { recursive: true });
// bigint-safe JSON: constructor args contain bigints
const toJson = (v: unknown) => JSON.stringify(v, (_, x) => (typeof x === "bigint" ? { $bigint: x.toString() } : x), 2);
const fromJson = (t: string) =>
  JSON.parse(t, (_, x) => (x && typeof x === "object" && typeof x.$bigint === "string" ? BigInt(x.$bigint) : x));

const state: DeploymentState = existsSync(stateFile)
  ? fromJson(readFileSync(stateFile, "utf8"))
  : { chainId, network: networkName, deployer, owner, keeper, guardian, params, StakesOracle: {}, StakesRounds: {}, updatedAt: "" };

function save() {
  state.updatedAt = new Date().toISOString();
  writeFileSync(stateFile, toJson(state) + "\n");
}

function stopIfAsked(step: string) {
  // Rehearsal hook: simulate the script being cut off after a step.
  if (process.env.DEPLOY_STOP_AFTER === step) {
    console.log(`\n[rehearsal] stopping after "${step}" as requested by DEPLOY_STOP_AFTER.`);
    process.exit(0);
  }
}

const eth = (wei: bigint) => `${Number(wei) / 1e18} ETH`;

// ------------------------------------------------------------------ summary + confirmation
const balance = await publicClient.getBalance({ address: deployer });
const resuming = Boolean(state.StakesOracle.address || state.StakesOracle.pendingTx);
console.log(`
StockStakes deploy — ${simulated ? `LOCAL SIMULATION (${networkName}, chain ${chainId})` : `${LIVE_CHAINS[chainId]} (chain ${chainId})`}
${resuming ? "Resuming a previous run.\n" : ""}
  Deployer   ${deployer}   balance ${eth(balance)}
  Owner      ${owner}
  Keeper     ${keeper}
  Guardian   ${guardian}

  Markets    ${boardMarkets.length} (Chainlink checks on ${Object.keys(chainlinkFeeds[chainId] ?? {}).length})
  Stakes     ${params.minStakeEth}–${params.maxStakeEth} ETH, fee ${params.feeBps / 100}% of profit
  Prices     final after ${params.challengeWindowSeconds / 60} min, void if not posted within ${params.postDeadlineSeconds / 3600} h
`);

if (balance === 0n) throw new Error("The deployer wallet has no ETH for gas.");

if (!simulated && process.env.DEPLOY_CONFIRM !== "DEPLOY") {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question("Type DEPLOY to continue: ");
  rl.close();
  if (answer.trim() !== "DEPLOY") {
    console.log("Cancelled. Nothing was sent.");
    process.exit(1);
  }
}

// ------------------------------------------------------------------ helpers
async function confirm(hash: Hash, what: string) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 180_000 });
  if (receipt.status !== "success") throw new Error(`${what} failed in tx ${hash}`);
  console.log(`  ✓ ${what}  (${hash})`);
  return receipt;
}

async function hasCode(address: Address) {
  const code = await publicClient.getCode({ address });
  return Boolean(code && code !== "0x");
}

async function ensureDeployed(name: "StakesOracle" | "StakesRounds", args: unknown[]): Promise<Address> {
  const rec = state[name];
  if (rec.address && (await hasCode(rec.address))) {
    console.log(`  • ${name} already at ${rec.address}`);
    return rec.address;
  }
  if (rec.pendingTx) {
    console.log(`  … waiting for the ${name} deployment sent earlier (${rec.pendingTx})`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: rec.pendingTx, timeout: 180_000 }).catch(() => null);
    if (receipt?.status === "success" && receipt.contractAddress) {
      Object.assign(rec, { address: receipt.contractAddress, block: Number(receipt.blockNumber), pendingTx: undefined });
      save();
      console.log(`  ✓ ${name} at ${rec.address}`);
      return rec.address!;
    }
    console.log(`  ! earlier ${name} deployment did not confirm; sending a new one`);
  }
  // Send directly and record the hash before anything else can fail. (Hardhat's
  // sendDeploymentTransaction looks the tx up right after sending, and a public RPC
  // that hasn't indexed it yet makes that throw — losing track of a sent deployment.)
  const artifact = await hre.artifacts.readArtifact(name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hash = await wallets[0].deployContract({ abi: artifact.abi, bytecode: artifact.bytecode as Hex, args: args as any });
  Object.assign(rec, { pendingTx: hash, constructorArgs: args });
  save();
  const receipt = await confirm(hash, `deploy ${name}`);
  Object.assign(rec, { address: receipt.contractAddress!, block: Number(receipt.blockNumber), pendingTx: undefined });
  save();
  console.log(`    at ${rec.address}`);
  return rec.address!;
}

function chunks<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

async function mapLimit<T, R>(xs: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (const c of chunks(xs, n)) out.push(...(await Promise.all(c.map(fn))));
  return out;
}

// ------------------------------------------------------------------ 1. contracts
console.log("1/4 Contracts");
const oracleArgs = [
  owner,
  keeper,
  guardian,
  BigInt(params.challengeWindowSeconds),
  BigInt(params.postDeadlineSeconds),
  params.maxDeviationBps,
  params.maxFeedAgeSeconds,
];
const oracleAddress = await ensureDeployed("StakesOracle", oracleArgs);
stopIfAsked("oracle");

const roundsArgs = [
  owner,
  oracleAddress,
  params.feeBps,
  params.entryCutoffSeconds,
  parseEther(params.minStakeEth),
  parseEther(params.maxStakeEth),
];
const roundsAddress = await ensureDeployed("StakesRounds", roundsArgs);
stopIfAsked("rounds");

const oracle = await viem.getContractAt("StakesOracle", oracleAddress);
const rounds = await viem.getContractAt("StakesRounds", roundsAddress);
const ownerIsDeployer = getAddress(await oracle.read.owner()) === deployer;

// ------------------------------------------------------------------ 2. Chainlink feeds
console.log("2/4 Chainlink sanity-check feeds");
const feedAbi = parseAbi(["function description() view returns (string)", "function decimals() view returns (uint8)"]);
const wantFeeds = Object.entries(chainlinkFeeds[chainId] ?? {}).flatMap(([symbol, feed]) => {
  const m = boardMarkets.find((x) => x.symbol === symbol);
  return m ? [{ symbol, key: m.key, feed: getAddress(feed) }] : [];
});
const feedTodo: { key: Hex; feed: Address }[] = [];
await mapLimit(wantFeeds, 10, async ({ symbol, key, feed }) => {
  const [current] = await oracle.read.feeds([key]);
  if (getAddress(current) === feed) return;
  const desc = await publicClient.readContract({ address: feed, abi: feedAbi, functionName: "description" }).catch(() => null);
  if (!desc || !desc.toUpperCase().includes(symbol)) {
    console.log(`  ! skipping ${symbol}: ${feed} is not a matching Chainlink feed (${desc ?? "no response"})`);
    return;
  }
  feedTodo.push({ key, feed });
});
if (feedTodo.length && !ownerIsDeployer) {
  console.log(`  ! ${feedTodo.length} feeds still need setting, but the owner is ${owner}. Have the owner call setFeeds.`);
} else {
  for (const c of chunks(feedTodo, CHUNK)) {
    await confirm(await oracle.write.setFeeds([c.map((x) => x.key), c.map((x) => x.feed)]), `set ${c.length} feeds`);
  }
  console.log(`  • ${wantFeeds.length - feedTodo.length} already set, ${feedTodo.length} newly set`);
}
stopIfAsked("feeds");

// ------------------------------------------------------------------ 3. list markets
console.log("3/4 Markets");
const listed = await mapLimit(boardMarkets, 10, (m) => rounds.read.listed([m.key]));
const toList = boardMarkets.filter((_, i) => !listed[i]);
if (toList.length && !ownerIsDeployer) {
  console.log(`  ! ${toList.length} markets still need listing, but the owner is ${owner}. Have the owner call listMarkets.`);
} else {
  for (const c of chunks(toList, CHUNK)) {
    await confirm(await rounds.write.listMarkets([c.map((m) => m.key), true]), `list ${c.length} markets`);
    stopIfAsked("first-markets");
  }
  console.log(`  • ${boardMarkets.length - toList.length} already listed, ${toList.length} newly listed`);
}

// ------------------------------------------------------------------ 4. verify
console.log("4/4 Verify on Blockscout");
if (simulated) {
  console.log("  • skipped (local simulation)");
} else {
  for (const name of ["StakesOracle", "StakesRounds"] as const) {
    const rec = state[name];
    if (rec.verified) {
      console.log(`  • ${name} already verified`);
      continue;
    }
    try {
      await verifyContract(
        { address: rec.address!, constructorArgs: rec.constructorArgs, contract: `contracts/${name}.sol:${name}`, provider: "blockscout" },
        hre,
      );
      rec.verified = true;
      save();
      console.log(`  ✓ ${name} verified`);
    } catch (err) {
      console.log(`  ! ${name} not verified yet: ${(err as Error).message.split("\n")[0]}`);
      console.log("    The contracts work regardless. Re-run the same command later to retry.");
    }
  }
}

// ------------------------------------------------------------------ outputs
save();
const site = exportSiteFiles();
console.log(`
Done.
  StakesOracle  ${oracleAddress}
  StakesRounds  ${roundsAddress}
  Saved         ${stateFile.pathname.replace(/^\//, "")}
  Site files    ${site.join(", ")}
${simulated ? "" : "\nNext: commit those files and push — Vercel redeploys and staking goes live.\n"}`);
