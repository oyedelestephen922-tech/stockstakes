"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, ArrowRight } from "lucide-react";
import { Panel, Stat } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { ProbabilityBar } from "@/components/ui/ProbabilityBar";
import { ProbabilitySlider } from "@/components/ui/ProbabilitySlider";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { estimatePayout } from "@/lib/scoring";
import { formatEth } from "@/lib/format";
import { MarketPrice, MarketStateTag } from "@/components/ui/MarketPrice";
import { NEUTRAL_ROOM } from "@/data/rounds";
import { cn } from "@/lib/cn";
import type { Market, RoundMarketState } from "@/lib/types";

export interface PredictionCardProps {
  market: Market;
  roundMarket: RoundMarketState;
  yes: number;
  stakeEth: number;
  selected: boolean;
  adjusting: boolean;
  onYesChange: (yes: number) => void;
  onToggleAdjust: () => void;
  onPlaceStake: () => void;
}

export function PredictionCard({
  market,
  roundMarket,
  yes,
  stakeEth,
  selected,
  adjusting,
  onYesChange,
  onToggleAdjust,
  onPlaceStake,
}: PredictionCardProps) {
  const no = 100 - yes;
  const side = yes >= 50 ? "YES" : "NO";
  const room = roundMarket.crowdYes;
  const est = estimatePayout(yes, stakeEth, room ?? NEUTRAL_ROOM);

  // Choosing a side mirrors the probability so your conviction carries over.
  const pickSide = (s: "YES" | "NO") => {
    if (s === side) return;
    onYesChange(100 - yes === 50 ? (s === "YES" ? 51 : 49) : 100 - yes);
  };

  return (
    <Panel
      as="article"
      className={cn(
        "transition-[border-color,box-shadow] duration-300",
        selected ? "border-accent/40 shadow-[0_0_0_1px_var(--accent-soft),0_20px_60px_-30px_var(--glow)]" : "hover:border-line-strong",
      )}
      ticks={selected}
    >
      <div className="grid gap-5 p-5 md:grid-cols-[1.15fr_1fr] md:gap-6">
        {/* left: asset, question, split */}
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <h3 className="truncate text-[17px] font-semibold tracking-tight text-fg">{market.name}</h3>
                <span className="num text-[11.5px] text-muted">{market.symbol}</span>
              </div>
              {market.price !== null ? (
                <MarketPrice market={market} size="sm" className="mt-0.5" />
              ) : (
                <span className="num text-[12px] text-muted">{market.pair}</span>
              )}
            </div>
            {market.price !== null ? (
              <MarketStateTag market={market} className="shrink-0" />
            ) : (
              <span className="label shrink-0">{market.category}</span>
            )}
          </div>

          <p className="mt-4 text-[15.5px] font-medium leading-snug tracking-[-0.01em] text-fg">{market.question}</p>

          {/* YES / NO selector */}
          <div role="radiogroup" aria-label="Your call" className="mt-4 grid grid-cols-2 gap-1.5 rounded-[11px] border border-line bg-panel-2 p-1">
            {(["YES", "NO"] as const).map((s) => {
              const active = side === s;
              const val = s === "YES" ? yes : no;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => pickSide(s)}
                  className={cn(
                    "relative flex h-11 items-center justify-between rounded-[8px] px-3 transition-colors",
                    active ? "text-fg" : "text-muted hover:text-fg-soft",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId={`side-${market.id}`}
                      className={cn(
                        "absolute inset-0 rounded-[8px] border",
                        s === "YES" ? "border-accent/40 bg-accent-soft" : "border-line-strong bg-panel",
                      )}
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  )}
                  <span className={cn("relative font-mono text-[11px] font-semibold tracking-[0.14em]", active && s === "YES" && "text-accent")}>
                    {s}
                  </span>
                  <AnimatedNumber value={val} format={(n) => `${Math.round(n)}%`} className="num relative text-[17px] font-semibold" />
                </button>
              );
            })}
          </div>

          <ProbabilityBar yes={yes} crowdYes={room ?? undefined} className="mt-4" />
          <div className="mt-2 flex justify-between font-mono text-[10.5px] text-muted">
            <span>
              You <span className="text-fg-soft">{yes}/{no}</span>
            </span>
            {room !== null ? (
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rotate-45 bg-gold" /> Room {room}/{100 - room}
              </span>
            ) : (
              <span>Room odds open at launch</span>
            )}
          </div>
        </div>

        {/* right: stake + reward + actions */}
        <div className="flex min-w-0 flex-col justify-between gap-4 border-t border-line pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Stake" value={`${formatEth(stakeEth)} ETH`} />
            <Stat
              label="Pool"
              value={roundMarket.poolEth !== null ? `${formatEth(roundMarket.poolEth, 2)} ETH` : "Opens at launch"}
              valueClassName="text-fg-soft"
            />
            <div className="col-span-2">
              <span className="label block">Estimated reward · if {side}</span>
              <div className="mt-1 flex items-baseline gap-2">
                <AnimatedNumber
                  value={est.favoured}
                  format={(n) => formatEth(n, 4)}
                  className="num text-[22px] font-semibold text-accent"
                />
                <span className="num text-[12px] text-muted">ETH</span>
              </div>
              <span className="num mt-0.5 block text-[11px] text-muted">
                if {side === "YES" ? "NO" : "YES"}: {formatEth(side === "YES" ? est.ifNo : est.ifYes, 4)} ETH · vs {room !== null ? "the room" : "a 50/50 room"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="md" onClick={onToggleAdjust} aria-expanded={adjusting} className="px-3">
              <SlidersHorizontal className="size-4" /> {adjusting ? "Done" : "Adjust Odds"}
            </Button>
            <Button size="md" onClick={onPlaceStake} className="px-3">
              Place Stake <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {adjusting && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-5 pb-5 pt-4">
              <ProbabilitySlider yes={yes} onChange={onYesChange} crowdYes={room ?? undefined} compact />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  );
}
