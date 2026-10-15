import {
  BaseError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  UserRejectedRequestError,
  createWalletClient,
  custom,
  getAddress,
  parseEther,
  type Hash,
} from "viem";
import { stakesRoundsAbi } from "./abis";
import { announceTx, publicClient } from "./client";
import { deployment, explorerUrl, marketKey, rpcUrl, targetChain, targetChainId } from "./chain";
import { readChainId } from "./injected";
import type { Eip1193Provider, TxResult } from "./types";

/**
 * Contract writes. Every result comes from the chain: "confirmed" only from a
 * successful receipt, never assumed. Each write is simulated first so a call
 * that would revert fails here with a readable reason, before the wallet opens.
 */

export type TxStage = "switching" | "checking" | "wallet" | "confirming";

interface WriteContext {
  provider: Eip1193Provider;
  address: string;
  onStage?: (stage: TxStage) => void;
  onSubmitted?: (hash: Hash) => void;
}

const REVERT_REASONS: Record<string, string> = {
  RoundNotOpen: "Entries for this round have closed. The next round opens at the top of the hour.",
  AlreadyEntered: "You already have a call on this market this round.",
  BadStake: "That stake is outside the allowed range.",
  BadProbability: "Probability must be between 0% and 100%.",
  EntriesPaused: "New entries are paused right now. Claims still work.",
  MarketNotListed: "This market isn't open for staking.",
  NotSettled: "This round isn't settled yet — prices are still being confirmed.",
  AlreadyClaimed: "Already claimed.",
  NoEntry: "No entry found for this wallet.",
};

function describe(err: unknown): TxResult {
  if (err instanceof BaseError) {
    if (err.walk((e) => e instanceof UserRejectedRequestError)) {
      return { status: "rejected", reason: "You cancelled the request in your wallet. Nothing was sent." };
    }
    if (err.walk((e) => e instanceof InsufficientFundsError)) {
      return { status: "failed", reason: "Not enough ETH in your wallet for this stake plus gas." };
    }
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName ?? "";
      return { status: "failed", reason: REVERT_REASONS[name] ?? `The contract rejected this (${name || revert.shortMessage}).` };
    }
    return { status: "failed", reason: err.shortMessage };
  }
  const e = err as { code?: number; message?: string };
  if (e?.code === 4001 || /reject|denied|cancel/i.test(e?.message ?? "")) {
    return { status: "rejected", reason: "You cancelled the request in your wallet. Nothing was sent." };
  }
  return { status: "failed", reason: e?.message ?? "Something went wrong." };
}

/** Make sure the wallet is on the target chain, adding the network to the wallet if needed. */
async function ensureChain(provider: Eip1193Provider) {
  if ((await readChainId(provider)) === targetChainId) return;
  const chainId = `0x${targetChainId.toString(16)}`;
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
  } catch (err) {
    const e = err as { code?: number; message?: string; data?: { originalError?: { code?: number } } };
    const code = e.code ?? e.data?.originalError?.code;
    if (code !== 4902 && !/unrecognized|not been added|unknown chain|add.*chain/i.test(e.message ?? "")) throw err;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId,
          chainName: targetChain.name,
          nativeCurrency: targetChain.nativeCurrency,
          rpcUrls: [rpcUrl],
          ...(explorerUrl ? { blockExplorerUrls: [explorerUrl] } : {}),
        },
      ],
    });
  }
  if ((await readChainId(provider)) !== targetChainId) {
    throw new Error(`Please switch your wallet to ${targetChain.name}.`);
  }
}

async function send(
  ctx: WriteContext,
  call: { functionName: "enter" | "claim" | "claimMany"; args: readonly unknown[]; value?: bigint },
): Promise<TxResult> {
  if (!deployment) {
    return { status: "unavailable", reason: "Round contracts are not live yet. No transaction was sent and nothing left your wallet." };
  }
  try {
    ctx.onStage?.("switching");
    await ensureChain(ctx.provider);
    const account = getAddress(ctx.address);

    ctx.onStage?.("checking");
    // The three calls share one code path, so the ABI-specific typing is relaxed here.
    const { request } = await publicClient().simulateContract({
      account,
      address: deployment.stakesRounds,
      abi: stakesRoundsAbi,
      functionName: call.functionName,
      args: call.args,
      ...(call.value !== undefined ? { value: call.value } : {}),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    ctx.onStage?.("wallet");
    const wallet = createWalletClient({ account, chain: targetChain, transport: custom(ctx.provider) });
    const hash = await wallet.writeContract(request);
    ctx.onSubmitted?.(hash);

    ctx.onStage?.("confirming");
    const receipt = await publicClient().waitForTransactionReceipt({ hash, timeout: 180_000 });
    if (receipt.status !== "success") return { status: "failed", reason: "The transaction reverted on-chain.", hash };
    announceTx();
    return { status: "confirmed", hash, blockNumber: Number(receipt.blockNumber) };
  } catch (err) {
    return describe(err);
  }
}

/** Enter `round` on a market: YES probability 0–100, stake in ETH. */
export function placeStake(
  ctx: WriteContext,
  draft: { round: number; marketId: string; yes: number; stakeEth: number },
): Promise<TxResult> {
  return send(ctx, {
    functionName: "enter",
    args: [BigInt(draft.round), marketKey(draft.marketId), Math.round(draft.yes * 100)],
    value: parseEther(draft.stakeEth.toFixed(6)),
  });
}

/** Claim payouts/refunds for one or more (round, market) entries. */
export function claimEntries(ctx: WriteContext, items: { round: number; marketId: string }[]): Promise<TxResult> {
  if (items.length === 1) {
    return send(ctx, { functionName: "claim", args: [BigInt(items[0].round), marketKey(items[0].marketId)] });
  }
  return send(ctx, {
    functionName: "claimMany",
    args: [items.map((i) => BigInt(i.round)), items.map((i) => marketKey(i.marketId))],
  });
}
