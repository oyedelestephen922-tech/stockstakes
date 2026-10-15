/**
 * Pre-deploy check: `npm run preflight`. Never prints a private key.
 *
 * Confirms contracts/.env holds valid, distinct deployer and keeper keys,
 * that KEEPER_ADDRESS (if set) matches the keeper key, and shows each
 * wallet's ETH balance on Robinhood Chain.
 */
import { createPublicClient, formatEther, getAddress, http, isAddress, type Address, type Hex } from "viem";
import { privateKeyToAddress } from "viem/accounts";
import { robinhood } from "viem/chains";

try {
  process.loadEnvFile(new URL("../.env", import.meta.url));
} catch {
  console.log("✗ contracts/.env not found.");
  process.exit(1);
}

const MIN_DEPLOYER = 3_000_000_000_000_000n; // 0.003 ETH
const MIN_KEEPER = 2_000_000_000_000_000n; // 0.002 ETH
let ok = true;
const fail = (msg: string) => {
  ok = false;
  console.log(`✗ ${msg}`);
};

function addressOf(name: string): Address | null {
  const raw = process.env[name]?.trim();
  if (!raw) {
    fail(`${name} is empty.`);
    return null;
  }
  const key = (raw.startsWith("0x") ? raw : `0x${raw}`) as Hex;
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    fail(`${name} doesn't look like a private key (expected 64 hex characters, optionally with 0x). Is it an address or seed phrase by mistake?`);
    return null;
  }
  try {
    return privateKeyToAddress(key);
  } catch {
    fail(`${name} is not a valid private key.`);
    return null;
  }
}

const deployer = addressOf("DEPLOYER_PRIVATE_KEY");
const keeper = addressOf("KEEPER_PRIVATE_KEY");
if (deployer) console.log(`✓ Deployer key valid → ${deployer}`);
if (keeper) console.log(`✓ Keeper key valid   → ${keeper}`);
if (deployer && keeper && deployer === keeper) fail("Deployer and keeper are the same wallet — use two different wallets.");

const keeperAddr = process.env.KEEPER_ADDRESS?.trim();
if (keeperAddr) {
  if (!isAddress(keeperAddr)) fail(`KEEPER_ADDRESS is not a valid address.`);
  else if (keeper && getAddress(keeperAddr) !== keeper) fail(`KEEPER_ADDRESS (${getAddress(keeperAddr)}) does not match the keeper key (${keeper}).`);
  else console.log("✓ KEEPER_ADDRESS matches the keeper key");
}
for (const name of ["GUARDIAN_ADDRESS", "OWNER_ADDRESS"]) {
  const v = process.env[name]?.trim();
  if (v && !isAddress(v)) fail(`${name} is not a valid address.`);
  if (v && isAddress(v) && name === "OWNER_ADDRESS" && deployer && getAddress(v) !== deployer) {
    console.log(`! OWNER_ADDRESS differs from the deployer: the deploy script can deploy, but the owner must then list markets and set feeds.`);
  }
}

const client = createPublicClient({ chain: robinhood, transport: http(process.env.ROBINHOOD_RPC_URL || undefined) });
try {
  const chainId = await client.getChainId();
  console.log(`✓ RPC reachable — chain ${chainId} (${robinhood.name})`);
  for (const [label, addr, min] of [
    ["Deployer", deployer, MIN_DEPLOYER],
    ["Keeper", keeper, MIN_KEEPER],
  ] as const) {
    if (!addr) continue;
    const bal = await client.getBalance({ address: addr });
    const line = `${label} balance on Robinhood Chain: ${formatEther(bal)} ETH`;
    if (bal >= min) console.log(`✓ ${line}`);
    else if (label === "Deployer") fail(`${line} — needs at least ${formatEther(min)} ETH to deploy.`);
    else console.log(`! ${line} — send it ~0.01 ETH before the site goes live (not needed for the deploy itself).`);
  }
} catch (err) {
  fail(`Couldn't reach Robinhood Chain RPC: ${(err as Error).message.split("\n")[0]}`);
}

console.log(ok ? "\nPreflight passed." : "\nPreflight found problems — fix them in contracts/.env and run again.");
process.exit(ok ? 0 : 1);
