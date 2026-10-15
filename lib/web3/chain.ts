import { stringToHex, hexToString, type Chain, type Hex } from "viem";
import { hardhat, robinhood, robinhoodTestnet } from "viem/chains";
import { deployments, type Deployment } from "./deployment";

/**
 * Which chain the site talks to. Defaults to Robinhood Chain mainnet (4663);
 * set NEXT_PUBLIC_CHAIN_ID=46630 for testnet or 31337 for a local node.
 * Contract addresses come from lib/web3/deployment.ts, written by the deploy script.
 */
const chains: Record<number, Chain> = { 4663: robinhood, 46630: robinhoodTestnet, 31337: hardhat };

export const targetChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 4663);
export const targetChain: Chain = chains[targetChainId] ?? robinhood;
export const deployment: Deployment | null = deployments[targetChainId] ?? null;
export const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || targetChain.rpcUrls.default.http[0];
export const explorerUrl = targetChain.blockExplorers?.default.url ?? null;

export function txUrl(hash: string): string | null {
  return explorerUrl ? `${explorerUrl}/tx/${hash}` : null;
}

export function addressUrl(address: string): string | null {
  return explorerUrl ? `${explorerUrl}/address/${address}` : null;
}

/** On-chain market key: the market id as a left-aligned bytes32 (same as Solidity `bytes32("nvda")`). */
export function marketKey(id: string): Hex {
  return stringToHex(id, { size: 32 });
}

export function marketIdFromKey(key: Hex): string {
  return hexToString(key, { size: 32 });
}
