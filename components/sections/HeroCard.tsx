"use client";

import { motion } from "framer-motion";
import { Panel, Stat } from "@/components/ui/Panel";
import { StatusPill } from "@/components/ui/StatusPill";
import { Sparkline } from "@/components/ui/Sparkline";
import { Countdown } from "@/components/ui/Countdown";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { useMarkets } from "@/providers/markets-provider";
import { useRoundNumber } from "@/hooks/use-round-number";
import { getCurrentRound, heroPreview } from "@/data/rounds";
import { formatEth, formatRoundId } from "@/lib/format";
import { MarketPrice, MarketStateTag, hasPriceHistory } from "@/components/ui/MarketPrice";
import { cn } from "@/lib/cn";

export function HeroCard() {
  const { markets } = useMarkets();
  const market = markets.find((m) => m.id === heroPreview.marketId)!;
  const round = getCurrentRound();
  const roundNo = useRoundNumber();
  const roundLabel = roundNo === null ? "#—" : formatRoundId(roundNo);
  const yes = heroPreview.yes;
  const no = 100 - yes;

  const sides = [
    { key: "YES", value: yes, active: yes >= no },
    { key: "NO", value: no, active: no > yes },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotateX: 6 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
      style={{ transformPerspective: 1200 }}
      className="relative"
    >
      {/* soft accent glow behind the card */}
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[32px] bg-[radial-gradient(60%_50%_at_70%_20%,var(--glow),transparent_70%)] opacity-70 blur-2xl" />

      <Panel glow className="overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="label text-fg-soft">Next round</span>
            <span className="num text-[12px] text-muted">{roundLabel}</span>
          </div>
          <StatusPill status={round.status} />
        </div>

        <div className="px-5 pb-5 pt-4">
          {/* market (+ live price and chart once a feed is connected) */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="num text-[13px] font-medium tracking-wide text-fg-soft">{market.pair}</span>
              <MarketPrice market={market} size="lg" className="mt-1" />
            </div>
            <MarketStateTag market={market} className="mt-1" />
          </div>

          {hasPriceHistory(market) && (
            <div className="relative mt-3 h-[72px]">
              <Sparkline
                data={market.history}
                width={400}
                height={72}
                positive={(market.changePct ?? 0) >= 0}
                live
                className="h-full w-full"
              />
            </div>
          )}

          <p className="mt-3 text-[17px] font-medium tracking-[-0.015em] text-fg">{market.question}</p>

          {/* YES / NO */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {sides.map((s) => (
              <div
                key={s.key}
                className={cn(
                  "relative overflow-hidden rounded-[11px] border p-3.5 transition-colors",
                  s.active ? "border-accent/45 bg-accent-soft" : "border-line bg-panel-2",
                )}
              >
                {s.active && (
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-[11px] shadow-[inset_0_0_24px_var(--glow)]"
                    animate={{ opacity: [0.35, 0.8, 0.35] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <div className="relative flex items-center justify-between">
                  <span className={cn("font-mono text-[11px] font-semibold tracking-[0.14em]", s.active ? "text-accent" : "text-muted")}>
                    {s.key}
                  </span>
                  <AnimatedNumber
                    value={s.value}
                    duration={1.2}
                    format={(n) => `${Math.round(n)}%`}
                    className={cn("num text-[22px] font-semibold", s.active ? "text-fg" : "text-fg-soft")}
                  />
                </div>
                <div className="relative mt-2.5 h-1 overflow-hidden rounded-full bg-line-strong/60">
                  <motion.div
                    className={cn("h-full rounded-full", s.active ? "bg-accent" : "bg-muted")}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.value}%` }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* stats */}
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5 rounded-[11px] border border-line px-4 py-3.5 sm:grid-cols-4">
            <Stat label="Your stake" value={`${formatEth(heroPreview.stakeEth)} ETH`} />
            <Stat label="Conviction" value={`${Math.max(yes, no)}%`} valueClassName="text-accent" />
            <Stat label="Round" value={roundLabel} />
            <Stat label="Status" value="PRE-LAUNCH" valueClassName="text-gold" />
          </div>

          <div className="mt-4">
            <Countdown size="sm" settlementLabel={round.settlementLabel} />
          </div>
        </div>
        <div className="border-t border-line bg-panel-2/60 px-5 py-2.5 font-mono text-[10.5px] tracking-wide text-muted">
          Example call · live ETH price · not a live position
        </div>
      </Panel>
    </motion.div>
  );
}
