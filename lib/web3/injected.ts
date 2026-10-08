import type { Eip1193Provider, WalletSession } from "./types";

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export function getInjectedProvider(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}

function weiHexToEth(hex: string): number {
  const wei = BigInt(hex);
  // keep 6 decimals of precision without floating point overflow
  return Number(wei / 1_000_000_000_000n) / 1_000_000;
}

export async function readBalanceEth(provider: Eip1193Provider, address: string): Promise<number | null> {
  try {
    const hex = (await provider.request({ method: "eth_getBalance", params: [address, "latest"] })) as string;
    return weiHexToEth(hex);
  } catch {
    return null;
  }
}

export async function readChainId(provider: Eip1193Provider): Promise<number | null> {
  try {
    const hex = (await provider.request({ method: "eth_chainId" })) as string;
    return parseInt(hex, 16);
  } catch {
    return null;
  }
}

/** Requests accounts from the user's wallet. Throws if the user rejects. */
export async function connectInjected(provider: Eip1193Provider): Promise<WalletSession> {
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts?.[0];
  if (!address) throw new Error("No account returned by wallet.");
  const [chainId, balanceEth] = await Promise.all([readChainId(provider), readBalanceEth(provider, address)]);
  return { kind: "injected", address, chainId, balanceEth };
}
