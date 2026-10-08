import type { CallDraft } from "@/lib/types";

export type WalletKind = "injected" | "demo";

export type WalletStatus = "disconnected" | "connecting" | "connected" | "demo" | "error";

export interface WalletSession {
  kind: WalletKind;
  /** Real address for injected wallets; null in demo mode. */
  address: string | null;
  chainId: number | null;
  /** ETH balance read from chain. null in demo mode or if unavailable. */
  balanceEth: number | null;
}

/** Minimal EIP-1193 provider shape (MetaMask, Rabby, Coinbase Wallet, …). */
export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

/**
 * Result of any write action. There is deliberately no "success" status that
 * can be produced without a real transaction hash confirmed on-chain.
 */
export type TxResult =
  | { status: "unavailable"; reason: string }
  | { status: "rejected"; reason: string }
  | { status: "submitted"; hash: string }
  | { status: "confirmed"; hash: string; blockNumber: number }
  | { status: "failed"; reason: string; hash?: string };

/** Contract-facing service. Implement with viem/wagmi once contracts are live. */
export interface StakingService {
  readonly live: boolean;
  enterRound(roundId: number, draft: CallDraft, session: WalletSession): Promise<TxResult>;
  claim(roundId: number, session: WalletSession): Promise<TxResult>;
}
