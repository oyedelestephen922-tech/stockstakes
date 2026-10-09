"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Panel } from "@/components/ui/Panel";
import { Sparkline } from "@/components/ui/Sparkline";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { MarketPrice, MarketStateTag, hasPriceHistory } from "@/components/ui/MarketPrice";
import { useMarkets } from "@/providers/markets-provider";
import { marketCategories } from "@/data/markets";
import { cn } from "@/lib/cn";
import type { Market, MarketCategory } from "@/lib/types";

const INITIAL = 6;
const STEP = 12;

function MarketCard({
  market,
  status,
  onCall,
}: {
  market: Market;
  status: "loading" | "live" | "unavailable";
  onCall: () => void;
}) {
  return (
    <Panel
      as="article"
      ticks={false}
      className="group flex h-full flex-col p-5 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h3 className="truncate text-[17px] font-semibold tracking-tight">{market.name}</h3>
            <span className="num text-[12px] text-muted">{market.symbol}</span>
          </div>
          <span className="label">{market.category}</span>
        </div>
        <MarketStateTag market={market} className="mt-1.5 shrink-0" />
      </div>

      <div className="mt-4 min-h-[34px]">
        {market.price !== null ? (
          <MarketPrice market={market} size="md" />
        ) : status === "loading" ? (
          <div className="h-7 w-32 animate-pulse rounded bg-panel-2" aria-label="Loading live price" />
        ) : (
          <p className="pt-1.5 font-mono text-[12px] text-muted">Live price unavailable right now.</p>
        )}
      </div>

      <div className="mt-3 h-11 pr-3">
        {hasPriceHistory(market) && (
          <Sparkline
            data={market.history}
            width={320}
            height={44}
            positive={(market.changePct ?? 0) >= 0}
            live={market.marketState !== "closed"}
            className="h-full w-full"
          />
        )}
      </div>

      <p className="mt-4 flex-1 text-[15px] font-medium leading-snug tracking-[-0.01em] text-fg">{market.question}</p>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
        <span className="num text-[11.5px] text-muted">Room odds at launch</span>
        <button
          type="button"
          onClick={onCall}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-fg-soft transition-colors hover:text-accent"
        >
          Make a call
          <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </button>
      </div>
    </Panel>
  );
}

export function Markets() {
  const { markets, status, select } = useMarkets();
  const [category, setCategory] = useState<MarketCategory | "All">("All");
  const [limit, setLimit] = useState(INITIAL);
  const list = useMemo(
    () => (category === "All" ? markets : markets.filter((m) => m.category === category)),
    [markets, category],
  );
  const visible = list.slice(0, limit);
  const remaining = list.length - visible.length;

  const callOn = (id: string) => {
    select(id);
    document.getElementById("play")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="markets" className="relative scroll-mt-20 border-t border-line bg-bg-elev py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <SectionHeading
          index="04"
          eyebrow="Markets"
          title="Markets on the board"
          body={`${markets.length} markets: every Robinhood Stock Token plus ETH. Prices update live every 30 seconds.`}
          aside={
            <StatusPill
              status={status === "live" ? "api" : "pending"}
              label={status === "live" ? "Live prices" : status === "loading" ? "Connecting" : "Feed offline"}
            />
          }
        />

        <div className="-mx-1 mb-6 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Category">
          {(["All", ...marketCategories] as const).map((c) => {
            const count = c === "All" ? markets.length : markets.filter((m) => m.category === c).length;
            return (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={category === c}
                onClick={() => {
                  setCategory(c);
                  setLimit(INITIAL);
                }}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors",
                  category === c ? "border-accent/50 bg-accent-soft text-accent" : "border-line text-fg-soft hover:border-line-strong hover:text-fg",
                )}
              >
                {c}
                <span className="text-muted">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((m, i) => (
            <Reveal key={m.id} delay={(i % 3) * 0.06} className="h-full">
              <MarketCard market={m} status={status} onCall={() => callOn(m.id)} />
            </Reveal>
          ))}
        </div>

        {(remaining > 0 || limit > INITIAL) && (
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {remaining > 0 && (
              <Button variant="secondary" onClick={() => setLimit((l) => l + STEP)}>
                Show {Math.min(STEP, remaining)} more
                <ChevronDown className="size-4" />
              </Button>
            )}
            {remaining > STEP && (
              <Button variant="ghost" onClick={() => setLimit(list.length)}>
                Show all {list.length}
              </Button>
            )}
            {remaining === 0 && limit > INITIAL && (
              <Button variant="ghost" onClick={() => setLimit(INITIAL)}>
                Show fewer
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
