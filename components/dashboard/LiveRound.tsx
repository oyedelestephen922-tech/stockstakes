"use client";

import { useCallback, useRef, useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { StatusPill } from "@/components/ui/StatusPill";
import { Countdown } from "@/components/ui/Countdown";
import { PredictionCard } from "./PredictionCard";
import { StakePanel } from "./StakePanel";
import { getMarkets } from "@/data/markets";
import { defaultCalls, getCurrentRound } from "@/data/rounds";
import { formatEth, formatRoundId } from "@/lib/format";

type Calls = Record<string, { yes: number; stakeEth: number }>;

export function LiveRound() {
  const round = getCurrentRound();
  const markets = getMarkets();
  const [calls, setCalls] = useState<Calls>(() => ({ ...defaultCalls }));
  const [selectedId, setSelectedId] = useState(markets[0].id);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const update = useCallback((id: string, patch: Partial<Calls[string]>) => {
    setCalls((c) => ({ ...c, [id]: { ...c[id], ...patch } }));
  }, []);

  const totalPool = round.markets.reduce((s, m) => s + m.poolEth, 0);
  const totalEntries = round.markets.reduce((s, m) => s + m.entries, 0);
  const selectedRound = round.markets.find((m) => m.marketId === selectedId)!;

  const focusPanel = (id: string) => {
    setSelectedId(id);
    // On stacked layouts, bring the stake panel into view.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section id="play" className="relative scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <SectionHeading
          index="01"
          eyebrow="Live round"
          title="Your next call."
          body="Set your probabilities. Choose your stake. Let the market decide."
          aside={<StatusPill status={round.source} label="Demo round data" />}
        />

        {/* round bar */}
        <Reveal>
          <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="col-span-2 bg-panel px-5 py-4 md:col-span-1">
              <Countdown size="md" showProgress />
            </div>
            {[
              ["Round", formatRoundId(round.id)],
              ["Total pool", `${formatEth(totalPool, 2)} ETH`],
              ["Entries", totalEntries.toLocaleString("en-US")],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col justify-center bg-panel px-5 py-4 last:col-span-2 md:last:col-span-1">
                <span className="label">{k}</span>
                <span className="num mt-1.5 text-[20px] font-semibold text-fg">{v}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-w-0 flex-col gap-4">
            {markets.map((m, i) => {
              const rm = round.markets.find((r) => r.marketId === m.id)!;
              const call = calls[m.id];
              return (
                <Reveal key={m.id} delay={i * 0.06}>
                  <PredictionCard
                    market={m}
                    roundMarket={rm}
                    yes={call.yes}
                    stakeEth={call.stakeEth}
                    selected={selectedId === m.id}
                    adjusting={adjusting === m.id}
                    onYesChange={(yes) => update(m.id, { yes })}
                    onToggleAdjust={() => setAdjusting((a) => (a === m.id ? null : m.id))}
                    onPlaceStake={() => focusPanel(m.id)}
                  />
                </Reveal>
              );
            })}
          </div>

          <div ref={panelRef} className="scroll-mt-24 lg:sticky lg:top-24">
            <Reveal delay={0.1}>
              <StakePanel
                round={round}
                markets={markets}
                selectedId={selectedId}
                onSelect={setSelectedId}
                roundMarket={selectedRound}
                yes={calls[selectedId].yes}
                stakeEth={calls[selectedId].stakeEth}
                onYesChange={(yes) => update(selectedId, { yes })}
                onStakeChange={(stakeEth) => update(selectedId, { stakeEth })}
              />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
