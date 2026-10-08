"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Panel } from "@/components/ui/Panel";
import { Sparkline } from "@/components/ui/Sparkline";
import { ProbabilityBar } from "@/components/ui/ProbabilityBar";
import { StatusPill } from "@/components/ui/StatusPill";
import { MarketPrice, MarketStateTag, hasPriceHistory } from "@/components/ui/MarketPrice";
import { useMarkets } from "@/providers/markets-provider";
import { getRoundMarket } from "@/data/rounds";
import { formatEth } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Market } from "@/lib/types";

function PriceBlock({ market, status }: { market: Market; status: "loading" | "live" | "unavailable" }) {
  if (market.price !== null) {
    return (
      <>
        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <span className="label block">Live price</span>
            <MarketPrice market={market} size="lg" className="mt-1" />
          </div>
        </div>
        {hasPriceHistory(market) && (
          <div className="mt-4 h-14">
            <Sparkline
              data={market.history}
              width={320}
              height={56}
              positive={(market.changePct ?? 0) >= 0}
              live={market.marketState !== "closed"}
              className="h-full w-full"
            />
          </div>
        )}
      </>
    );
  }
  if (status === "loading") {
    return (
      <div className="mt-5 space-y-2" aria-label="Loading live price">
        <div className="h-3 w-16 animate-pulse rounded bg-panel-2" />
        <div className="h-7 w-36 animate-pulse rounded bg-panel-2" />
      </div>
    );
  }
  return <p className="mt-5 font-mono text-[12px] text-muted">Live price unavailable right now.</p>;
}

export function Markets() {
  const { markets, status } = useMarkets();

  return (
    <section id="markets" className="relative scroll-mt-20 border-t border-line bg-bg-elev py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <SectionHeading
          index="04"
          eyebrow="Markets"
          title="Markets on the board"
          body="Each round runs on a fixed set of markets. Prices update live every 30 seconds."
          aside={<StatusPill status={status === "live" ? "api" : "pending"} label={status === "live" ? "Live prices" : status === "loading" ? "Connecting" : "Feed offline"} />}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {markets.map((m, i) => {
            const rm = getRoundMarket(m.id);
            const room = rm?.crowdYes ?? null;
            return (
              <Reveal key={m.id} delay={i * 0.07} className={cn(i === 2 && "md:col-span-2 lg:col-span-1")}>
                <Panel
                  as="article"
                  ticks={false}
                  className="group h-full p-5 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-[18px] font-semibold tracking-tight">{m.name}</h3>
                        <span className="num text-[12px] text-muted">{m.symbol}</span>
                      </div>
                      <span className="label">{m.category}</span>
                    </div>
                    <MarketStateTag market={m} className="mt-1.5" />
                  </div>

                  <PriceBlock market={m} status={status} />

                  <p className="mt-5 text-[16px] font-medium leading-snug tracking-[-0.01em] text-fg">{m.question}</p>

                  <div className="mt-3">
                    <span className="label mb-2 block">Room probability</span>
                    {room !== null ? (
                      <>
                        <div className="mb-2 flex justify-between font-mono text-[12px]">
                          <span className="text-accent">YES {room}%</span>
                          <span className="text-muted">NO {100 - room}%</span>
                        </div>
                        <ProbabilityBar yes={room} height={6} />
                      </>
                    ) : (
                      <p className="rounded-[9px] border border-dashed border-line-strong px-3 py-2 font-mono text-[11.5px] text-muted">
                        Opens when on-chain rounds go live
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                    <span className="num text-[12px] text-muted">
                      {rm?.poolEth != null ? `Pool ${formatEth(rm.poolEth, 2)} ETH · ${rm.entries ?? 0} entries` : "Pool opens at launch"}
                    </span>
                    <Link
                      href="/#play"
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-fg-soft transition-colors hover:text-accent"
                    >
                      Make a call{" "}
                      <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </Panel>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
