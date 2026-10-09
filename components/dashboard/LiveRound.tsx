"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { StatusPill } from "@/components/ui/StatusPill";
import { Countdown } from "@/components/ui/Countdown";
import { PredictionCard } from "./PredictionCard";
import { MarketRow } from "./MarketRow";
import { StakePanel } from "./StakePanel";
import { useMarkets } from "@/providers/markets-provider";
import { useRoundNumber } from "@/hooks/use-round-number";
import { defaultCalls, getCurrentRound } from "@/data/rounds";
import { marketCategories } from "@/data/markets";
import { formatEth, formatRoundId } from "@/lib/format";
import { contractsLive } from "@/lib/web3/contracts";
import { cn } from "@/lib/cn";
import type { MarketCategory } from "@/lib/types";

type Calls = Record<string, { yes: number; stakeEth: number }>;

export function LiveRound() {
  const round = getCurrentRound();
  const { markets, status: priceStatus, selectedId, select } = useMarkets();
  const roundNo = useRoundNumber();
  const [calls, setCalls] = useState<Calls>(() => ({ ...defaultCalls }));
  const [adjusting, setAdjusting] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MarketCategory | "All">("All");
  const panelRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const update = useCallback((id: string, patch: Partial<Calls[string]>) => {
    setCalls((c) => ({ ...c, [id]: { ...c[id], ...patch } }));
  }, []);

  const pools = round.markets.map((m) => m.poolEth).filter((v): v is number => v !== null);
  const entries = round.markets.map((m) => m.entries).filter((v): v is number => v !== null);
  const totalPool = pools.length ? `${formatEth(pools.reduce((a, b) => a + b, 0), 2)} ETH` : "At launch";
  const totalEntries = entries.length ? entries.reduce((a, b) => a + b, 0).toLocaleString("en-US") : "At launch";

  const selected = markets.find((m) => m.id === selectedId) ?? markets[0];
  const selectedRound = round.markets.find((m) => m.marketId === selected.id)!;

  const others = useMemo(() => {
    const q = query.trim().toLowerCase();
    return markets.filter(
      (m) =>
        m.id !== selected.id &&
        (category === "All" || m.category === category) &&
        (!q || m.symbol.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)),
    );
  }, [markets, selected.id, category, query]);

  const choose = (id: string) => {
    select(id);
    setAdjusting(false);
    requestAnimationFrame(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const focusPanel = () => {
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
          body={`${markets.length} markets every hour. Pick one, set your probability, choose your stake.`}
          aside={
            <div className="flex flex-wrap gap-2">
              <StatusPill status={priceStatus === "live" ? "api" : "pending"} label={priceStatus === "live" ? "Live prices" : "Connecting prices"} />
              {!contractsLive && <StatusPill status="prelaunch" label="Staking opens at launch" />}
            </div>
          }
        />

        {/* round bar */}
        <Reveal>
          <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="col-span-2 bg-panel px-5 py-4 md:col-span-1">
              <Countdown size="md" showProgress />
            </div>
            {[
              ["Round", roundNo === null ? "#—" : formatRoundId(roundNo)],
              ["Total pool", totalPool],
              ["Entries", totalEntries],
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
            {/* selected market */}
            <div ref={cardRef} className="scroll-mt-24">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <PredictionCard
                    market={selected}
                    roundMarket={selectedRound}
                    yes={calls[selected.id].yes}
                    stakeEth={calls[selected.id].stakeEth}
                    selected
                    adjusting={adjusting}
                    onYesChange={(yes) => update(selected.id, { yes })}
                    onToggleAdjust={() => setAdjusting((a) => !a)}
                    onPlaceStake={focusPanel}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* board */}
            <div className="rounded-[var(--radius-card)] border border-line bg-bg-elev p-3 sm:p-4">
              <div className="flex flex-col gap-3 px-1 pb-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="label">All markets · {markets.length}</span>
                <label className="relative block sm:w-60">
                  <span className="sr-only">Search markets</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search ticker or name"
                    className="h-10 w-full rounded-[10px] border border-line bg-panel pl-9 pr-9 text-[14px] text-fg outline-none transition-colors placeholder:text-muted focus:border-accent/60"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-fg"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </label>
              </div>

              <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Category">
                {(["All", ...marketCategories] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="tab"
                    aria-selected={category === c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      "h-8 shrink-0 rounded-full border px-3.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors",
                      category === c ? "border-accent/50 bg-accent-soft text-accent" : "border-line text-fg-soft hover:border-line-strong hover:text-fg",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                {others.map((m) => (
                  <MarketRow key={m.id} market={m} yes={calls[m.id].yes} priceStatus={priceStatus} onSelect={() => choose(m.id)} />
                ))}
                {others.length === 0 && (
                  <p className="rounded-[12px] border border-dashed border-line-strong px-4 py-6 text-center text-[13px] text-muted">
                    No other markets match. Try a different search or category.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div ref={panelRef} className="scroll-mt-24 lg:sticky lg:top-24">
            <Reveal delay={0.1}>
              <StakePanel
                round={round}
                markets={markets}
                selectedId={selected.id}
                onSelect={choose}
                roundMarket={selectedRound}
                yes={calls[selected.id].yes}
                stakeEth={calls[selected.id].stakeEth}
                onYesChange={(yes) => update(selected.id, { yes })}
                onStakeChange={(stakeEth) => update(selected.id, { stakeEth })}
              />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
