/**
 * Keeper entry point — run hourly by .github/workflows/keeper.yml.
 *
 *   node keeper/run.ts              post missing prices
 *   DRY_RUN=1 node keeper/run.ts    fetch and report only, no transactions
 *
 * Env: KEEPER_PRIVATE_KEY (required unless DRY_RUN), CHAIN_ID (default 4663),
 *      RPC_URL (optional; defaults to the chain's public RPC).
 *
 * Exits non-zero when a transaction fails, the wallet is out of gas, or even
 * ETH (which trades 24/7) has no price — so GitHub emails the repo owner.
 */
import { createPublicClient, createWalletClient, formatEther, http, type Chain, type PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { robinhood, robinhoodTestnet } from "viem/chains";
import { deployments } from "../../lib/web3/deployment.ts";
import { boardMarkets } from "../config/markets.ts";
import { createPriceSource } from "./prices.ts";
import { runKeeper } from "./keeper.ts";

// Local runs read contracts/.env; on GitHub the values come from repository secrets.
try {
  process.loadEnvFile(new URL("../.env", import.meta.url));
} catch {
  // no .env file — fine
}

const LOW_BALANCE = 2_000_000_000_000_000n; // 0.002 ETH

const chainId = Number(process.env.CHAIN_ID || 4663);
const chain: Chain | undefined = { 4663: robinhood, 46630: robinhoodTestnet }[chainId];
if (!chain) throw new Error(`Unsupported CHAIN_ID ${chainId}`);
const deployment = deployments[chainId];
if (!deployment) {
  console.log(`StockStakes is not deployed on chain ${chainId} yet (lib/web3/deployment.ts). Nothing to do.`);
  process.exit(0);
}

const dryRun = process.env.DRY_RUN === "1";
const transport = http(process.env.RPC_URL || process.env.ROBINHOOD_RPC_URL || undefined, { retryCount: 3, retryDelay: 1000 });
const publicClient = createPublicClient({ chain, transport }) as PublicClient;

const key = process.env.KEEPER_PRIVATE_KEY?.trim();
if (!key && !dryRun) throw new Error("KEEPER_PRIVATE_KEY is not set (GitHub → Settings → Secrets and variables → Actions).");
const account = key ? privateKeyToAccount((key.startsWith("0x") ? key : `0x${key}`) as `0x${string}`) : undefined;
const walletClient = account ? createWalletClient({ account, chain, transport }) : undefined;

let failed = false;
if (account) {
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Keeper ${account.address} on ${chain.name}, balance ${formatEther(balance)} ETH`);
  if (balance === 0n && !dryRun) {
    console.error("! The keeper wallet has no ETH for gas. Send it about 0.01 ETH.");
    process.exit(1);
  }
  if (balance < LOW_BALANCE) console.warn("! Keeper balance is low — top it up soon (about 0.01 ETH).");
}

const result = await runKeeper({
  publicClient,
  walletClient,
  oracle: deployment.stakesOracle,
  markets: boardMarkets,
  priceAt: createPriceSource(),
  dryRun,
});

const byHour = (xs: { market: string; hour: number }[]) =>
  [...new Set(xs.map((x) => x.hour))].map((h) => `${h}: ${xs.filter((x) => x.hour === h).map((x) => x.market).join(" ")}`);

console.log(`\nSummary: posted ${result.posted}, transactions ${result.txs.length}, failed ${result.failedTxs.length}`);
if (result.noPrice.length) {
  console.log(`No fresh price (those rounds refund if still missing at the deadline): ${result.noPrice.length}`);
  for (const line of byHour(result.noPrice)) console.log(`  hour ${line}`);
}
if (result.rejected.length) {
  console.log("Rejected by the Chainlink sanity check (those rounds refund):");
  for (const r of result.rejected) console.log(`  hour ${r.hour}: ${r.market} (${r.reason})`);
}
if (result.failedTxs.length) failed = true;
const latest = result.hours.at(-1);
if (latest !== undefined && result.noPrice.some((x) => x.market === "eth" && x.hour === latest)) {
  console.error("! No ETH price for the latest hour — price sources may be down.");
  failed = true;
}
process.exit(failed ? 1 : 0);
