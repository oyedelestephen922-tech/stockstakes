import { createPublicClient, http, type PublicClient } from "viem";
import { rpcUrl, targetChain } from "./chain";

let client: PublicClient | null = null;

/** Read-only client for the target chain. Reads are batched into Multicall3 calls. */
export function publicClient(): PublicClient {
  client ??= createPublicClient({
    chain: targetChain,
    transport: http(rpcUrl, { batch: true, retryCount: 2 }),
    // Robinhood Chain has Multicall3; a bare local node does not.
    batch: { multicall: Boolean(targetChain.contracts?.multicall3) },
  }) as PublicClient;
  return client;
}

/** Fired after any confirmed stake or claim so round data and entries refresh. */
export const TX_EVENT = "stockstakes:tx";

export function announceTx() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(TX_EVENT));
}
