"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info, LoaderCircle, Wallet, ArrowRight, ChevronDown } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { ProbabilitySlider } from "@/components/ui/ProbabilitySlider";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Countdown } from "@/components/ui/Countdown";
import { StatusPill } from "@/components/ui/StatusPill";
import { useWallet } from "@/providers/wallet-provider";
import { stakingService } from "@/lib/web3/staking";
import type { TxResult } from "@/lib/web3/types";
import { estimatePayout } from "@/lib/scoring";
import { formatEth } from "@/lib/format";
import { NEUTRAL_ROOM, stakeLimits, stakePresets } from "@/data/rounds";
import { marketCategories } from "@/data/markets";
import { roundNumberAt } from "@/lib/round-clock";
import { cn } from "@/lib/cn";
import type { Market, PositionStatus, Round, RoundMarketState } from "@/lib/types";

export interface StakePanelProps {
  round: Round;
  markets: Market[];
  selectedId: string;
  onSelect: (id: string) => void;
  roundMarket: RoundMarketState;
  yes: number;
  stakeEth: number;
  onYesChange: (yes: number) => void;
  onStakeChange: (eth: number) => void;
}

function Row({ label, children, strong }: { label: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-[13px] text-muted">{label}</span>
      <span className={cn("num text-right", strong ? "text-[18px] font-semibold text-accent" : "text-[14px] font-medium text-fg")}>
        {children}
      </span>
    </div>
  );
}

export function StakePanel({
  round,
  markets,
  selectedId,
  onSelect,
  roundMarket,
  yes,
  stakeEth,
  onYesChange,
  onStakeChange,
}: StakePanelProps) {
  const wallet = useWallet();
  const [input, setInput] = useState(String(stakeEth));
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TxResult | null>(null);

  // keep the text field in sync when stake changes elsewhere
  useEffect(() => {
    setInput((prev) => (Number(prev) === stakeEth ? prev : String(stakeEth)));
  }, [stakeEth]);

  // a new call invalidates the previous attempt's message
  useEffect(() => setResult(null), [selectedId, yes, stakeEth, wallet.status]);

  const market = markets.find((m) => m.id === selectedId)!;
  const room = roundMarket.crowdYes;
  const est = estimatePayout(yes, stakeEth, room ?? NEUTRAL_ROOM);
  const balance = wallet.session?.balanceEth ?? null;

  const parsed = Number(input);
  let error: string | null = null;
  if (input.trim() === "" || !Number.isFinite(parsed)) error = "Enter a stake amount.";
  else if (parsed < stakeLimits.min) error = `Minimum stake is ${stakeLimits.min} ETH.`;
  else if (parsed > stakeLimits.max) error = `Maximum stake is ${stakeLimits.max} ETH.`;
  else if (balance !== null && parsed > balance) error = "Stake exceeds your wallet balance.";

  const status: PositionStatus = submitting
    ? "pending"
    : result
      ? "unavailable"
      : !wallet.isReady
        ? "awaiting-wallet"
        : wallet.session?.kind === "demo"
          ? "demo"
          : round.status === "open"
            ? "open"
            : round.status === "prelaunch"
              ? "unavailable"
              : "closed";

  const onInput = (v: string) => {
    if (!/^\d*\.?\d{0,6}$/.test(v)) return;
    setInput(v);
    const n = Number(v);
    if (v !== "" && Number.isFinite(n) && n >= stakeLimits.min && n <= stakeLimits.max) onStakeChange(n);
  };

  const place = async () => {
    if (!wallet.session || error) return;
    setSubmitting(true);
    setResult(null);
    try {
      const r = await stakingService.enterRound(roundNumberAt(Date.now()), { marketId: selectedId, yes, stakeEth }, wallet.session);
      setResult(r);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Panel glow className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h3 className="text-[17px] font-semibold tracking-tight">Back your conviction</h3>
        <StatusPill status={status} />
      </div>

      <div className="px-5 pb-5 pt-4">
        {/* market picker */}
        <label htmlFor="stake-market" className="label block">
          Market
        </label>
        <div className="relative mt-2">
          <select
            id="stake-market"
            value={selectedId}
            onChange={(e) => onSelect(e.target.value)}
            className="num h-11 w-full cursor-pointer appearance-none rounded-[11px] border border-line bg-panel-2 pl-4 pr-10 text-[14px] font-medium text-fg outline-none transition-colors hover:border-line-strong focus:border-accent/60"
          >
            <optgroup label="Popular">
              {markets
                .filter((m) => m.featured)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.symbol} · {m.name}
                  </option>
                ))}
            </optgroup>
            {marketCategories.map((c) => {
              const rest = markets.filter((m) => !m.featured && m.category === c);
              if (!rest.length) return null;
              return (
                <optgroup key={c} label={c}>
                  {rest.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.symbol} · {m.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        </div>
        <p className="mt-3 text-[14px] text-fg-soft">{market.question}</p>

        <div className="mt-5">
          <ProbabilitySlider yes={yes} onChange={onYesChange} crowdYes={room ?? undefined} />
        </div>

        {/* stake amount */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <label htmlFor="stake-amount" className="label">
              Stake amount
            </label>
            {balance !== null && (
              <span className="num text-[11px] text-muted">Balance {formatEth(balance, 4)} ETH</span>
            )}
          </div>
          <div
            className={cn(
              "mt-2 flex h-14 items-center rounded-[11px] border bg-panel-2 px-4 transition-colors focus-within:border-accent/60",
              error ? "border-down/50" : "border-line",
            )}
          >
            <input
              id="stake-amount"
              inputMode="decimal"
              autoComplete="off"
              value={input}
              onChange={(e) => onInput(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby="stake-error"
              className="num min-w-0 flex-1 bg-transparent text-[22px] font-semibold text-fg outline-none placeholder:text-muted"
              placeholder="0.000"
            />
            <span className="num text-[14px] font-medium text-muted">ETH</span>
          </div>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {stakePresets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setInput(String(p));
                  onStakeChange(p);
                }}
                className={cn(
                  "num h-9 rounded-[8px] border text-[12px] transition-colors",
                  stakeEth === p && !error
                    ? "border-accent/50 bg-accent-soft text-accent"
                    : "border-line text-fg-soft hover:border-line-strong hover:text-fg",
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <AnimatePresence>
            {error && (
              <motion.p
                id="stake-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 text-[12px] text-down"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* summary */}
        <div className="mt-5 divide-y divide-line rounded-[11px] border border-line px-4">
          <Row label="Your probability">
            <AnimatedNumber value={yes} format={(n) => `${Math.round(n)}% YES`} />
          </Row>
          <Row label="Your stake">{formatEth(stakeEth)} ETH</Row>
          <Row label={`Potential payout · if ${est.favouredSide}`} strong>
            <AnimatedNumber value={est.favoured} format={(n) => `${formatEth(n, 4)} ETH`} />
          </Row>
          <Row label={`If ${est.favouredSide === "YES" ? "NO" : "YES"}`}>
            <span className="text-fg-soft">
              {formatEth(est.favouredSide === "YES" ? est.ifNo : est.ifYes, 4)} ETH
            </span>
          </Row>
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
          <Info className="mt-px size-3 shrink-0" />
          {room !== null
            ? `Estimate compares your call with the room's average (${room}% YES).`
            : "Estimate compares your call with a neutral 50/50 room until live rounds open."}{" "}
          Not a guarantee — you can lose your stake.
        </p>

        <div className="mt-5 rounded-[11px] border border-line bg-panel-2/60 p-4">
          <Countdown size="sm" settlementLabel={round.settlementLabel} />
        </div>

        {/* action */}
        <div className="mt-5">
          {!wallet.isReady ? (
            <Button size="lg" className="w-full" onClick={wallet.openConnect}>
              <Wallet className="size-4" /> Connect Wallet
            </Button>
          ) : (
            <Button size="lg" className="w-full" onClick={place} disabled={Boolean(error) || submitting || round.status === "closed" || round.status === "settling" || round.status === "settled"}>
              {submitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" /> Preparing…
                </>
              ) : (
                <>
                  Place Stake <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          )}

          <AnimatePresence>
            {result && result.status !== "submitted" && result.status !== "confirmed" && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="status"
                className="mt-3 rounded-[10px] border border-gold/30 bg-gold-soft px-3.5 py-3 text-[12.5px] leading-relaxed text-fg-soft"
              >
                <span className="font-medium text-gold">No transaction sent. </span>
                {result.reason}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Panel>
  );
}
