"use client";

import { useState } from "react";
import { ExternalLink, LoaderCircle, RefreshCw } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { useWallet } from "@/providers/wallet-provider";
import { useMarkets } from "@/providers/markets-provider";
import { useMyEntries, type EntryStatus, type MyEntry } from "@/hooks/use-my-entries";
import { claimEntries } from "@/lib/web3/staking";
import { txUrl } from "@/lib/web3/chain";
import { formatEth, formatRoundId, pad2 } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { TxResult } from "@/lib/web3/types";

const pill: Record<EntryStatus, { status: "open" | "pending" | "settling" | "settled" | "closed" | "api"; label: string }> = {
  open: { status: "open", label: "Starts soon" },
  live: { status: "pending", label: "In play" },
  settling: { status: "settling", label: "Settling" },
  won: { status: "api", label: "Won" },
  lost: { status: "closed", label: "Lost" },
  even: { status: "settled", label: "Even" },
  refund: { status: "settling", label: "Refund" },
  claimed: { status: "settled", label: "Claimed" },
  refunded: { status: "settled", label: "Refunded" },
};

function hourLabel(ms: number) {
  const d = new Date(ms);
  const e = new Date(ms + 3_600_000);
  return `${pad2(d.getHours())}:00–${pad2(e.getHours())}:00`;
}

/** The connected wallet's recent entries, with payouts and Claim buttons. Read from the chain. */
export function MyEntries() {
  const wallet = useWallet();
  const { markets } = useMarkets();
  const address = wallet.session?.kind === "injected" ? wallet.session.address : null;
  const { entries, status, refresh } = useMyEntries(address);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<TxResult | null>(null);

  if (!address) return null;

  const claimable = entries.filter((e) => !e.claimed && e.payoutEth > 0 && e.outcome !== "Unsettled");
  const totalClaimable = claimable.reduce((a, e) => a + e.payoutEth, 0);

  const claim = async (items: MyEntry[], id: string) => {
    if (!wallet.provider || !items.length) return;
    setBusy(id);
    setResult(null);
    const r = await claimEntries(
      { provider: wallet.provider, address },
      items.map((e) => ({ round: e.round, marketId: e.marketId })),
    );
    setResult(r);
    setBusy(null);
  };

  return (
    <Panel className="mt-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <h3 className="text-[17px] font-semibold tracking-tight">Your entries</h3>
          <button
            type="button"
            onClick={refresh}
            aria-label="Refresh entries"
            className="inline-flex size-7 items-center justify-center rounded-md text-muted hover:text-fg"
          >
            <RefreshCw className={cn("size-3.5", status === "loading" && "animate-spin")} />
          </button>
        </div>
        {claimable.length > 0 && (
          <Button size="md" onClick={() => claim(claimable, "all")} disabled={busy !== null}>
            {busy === "all" ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Claim {formatEth(totalClaimable, 4)} ETH{claimable.length > 1 ? ` · ${claimable.length} entries` : ""}
          </Button>
        )}
      </div>

      {result && (
        <div
          role="status"
          className={cn(
            "border-b border-line px-5 py-3 text-[12.5px]",
            result.status === "confirmed" ? "text-accent" : "text-fg-soft",
          )}
        >
          {result.status === "confirmed" ? (
            <>
              Claimed.{" "}
              {txUrl(result.hash) && (
                <a href={txUrl(result.hash)!} target="_blank" rel="noopener noreferrer" className="underline">
                  View transaction
                </a>
              )}
            </>
          ) : "reason" in result ? (
            result.reason
          ) : null}
        </div>
      )}

      {status === "loading" && entries.length === 0 ? (
        <p className="px-5 py-6 text-[13px] text-muted">Loading your entries from the chain…</p>
      ) : status === "error" && entries.length === 0 ? (
        <p className="px-5 py-6 text-[13px] text-muted">Couldn&apos;t reach the chain to load your entries. Try refreshing.</p>
      ) : entries.length === 0 ? (
        <p className="px-5 py-6 text-[13px] text-muted">No entries yet. Your stakes show up here once confirmed on-chain.</p>
      ) : (
        <ul className="divide-y divide-line">
          {entries.map((e) => {
            const m = markets.find((x) => x.id === e.marketId);
            const side = e.yes >= 50 ? "YES" : "NO";
            const id = `${e.round}:${e.marketId}`;
            const canClaim = !e.claimed && e.payoutEth > 0 && e.outcome !== "Unsettled";
            const p = pill[e.status];
            return (
              <li key={id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-3.5 sm:grid-cols-[minmax(0,1.2fr)_1fr_1fr_auto]">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="num text-[14px] font-semibold text-fg">{m?.symbol ?? e.marketId.toUpperCase()}</span>
                    <span className="truncate text-[12.5px] text-muted">{m?.name}</span>
                  </div>
                  <span className="num text-[11.5px] text-muted">
                    {formatRoundId(e.round)} · {hourLabel(e.startsAt)}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <span className="label block">Call · stake</span>
                  <span className="num text-[13px] text-fg-soft">
                    {Math.max(e.yes, 100 - e.yes)}% {side} · {formatEth(e.stakeEth)} ETH
                  </span>
                </div>
                <div className="hidden sm:block">
                  <span className="label block">{e.claimed ? "Paid" : "Payout"}</span>
                  <span className="num text-[13px] text-fg-soft">
                    {e.outcome === "Unsettled" ? "—" : e.claimed ? "Claimed" : `${formatEth(e.payoutEth, 4)} ETH`}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <StatusPill status={p.status} label={p.label} />
                  {canClaim && (
                    <Button size="sm" variant="secondary" onClick={() => claim([e], id)} disabled={busy !== null}>
                      {busy === id ? <LoaderCircle className="size-3.5 animate-spin" /> : "Claim"}
                    </Button>
                  )}
                  {txUrl(e.txHash) && (
                    <a
                      href={txUrl(e.txHash)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View entry transaction"
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted hover:text-fg"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
