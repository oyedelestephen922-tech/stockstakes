"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Panel } from "@/components/ui/Panel";
import { Sparkline } from "@/components/ui/Sparkline";
import { ProbabilityBar } from "@/components/ui/ProbabilityBar";
import { StatusPill } from "@/components/ui/StatusPill";
import { AssetGlyph } from "@/components/ui/AssetGlyph";
import { getMarkets } from "@/data/markets";
import { getCurrentRound, getRoundMarket } from "@/data/rounds";
import { formatEth } from "@/lib/format";
import { cn } from "@/lib/cn";
import { MarketPrice, hasPriceHistory } from "@/components/ui/MarketPrice";

export function Markets() {
  const markets = getMarkets();
  const round = getCurrentRound();

  return (
    <section id="markets" className="relative scroll-mt-20 border-t border-line bg-bg-elev py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <SectionHeading
          index="04"
          eyebrow="Markets"
          title="Markets on the board"
          body="Each round runs on a fixed set of markets. Here is where the room stands on every question this hour."
          aside={<StatusPill status="demo" label="Demo round data" />}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {markets.map((m, i) => {
            const rm = getRoundMarket(m.id);
            const crowd = rm?.crowdYes ?? 50;
            return (
              <Reveal key={m.id} delay={i * 0.07} className={cn(i === 2 && "md:col-span-2 lg:col-span-1")}>
                <Panel as="article" ticks={false} className="group h-full p-5 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <AssetGlyph symbol={m.symbol} />
                      <div>
                        <h3 className="text-[16px] font-semibold tracking-tight">{m.name}</h3>
                        <span className="label">{m.category}</span>
                      </div>
                    </div>
                    <StatusPill status={round.status} />
                  </div>

                  {m.price !== null && (
                    <div className="mt-5">
                      <span className="label block">Price</span>
                      <MarketPrice market={m} size="lg" className="mt-1" />
                    </div>
                  )}

                  {hasPriceHistory(m) && (
                    <div className="mt-4 h-14">
                      <Sparkline
                        data={m.history}
                        width={320}
                        height={56}
                        positive={(m.hourlyChangePct ?? 0) >= 0}
                        className="h-full w-full"
                      />
                    </div>
                  )}

                  <p className="mt-5 text-[16px] font-medium leading-snug tracking-[-0.01em] text-fg">{m.question}</p>

                  <div className="mt-3">
                    <span className="label mb-2 block">Room probability</span>
                    <div className="mb-2 flex justify-between font-mono text-[12px]">
                      <span className="text-accent">YES {crowd}%</span>
                      <span className="text-muted">NO {100 - crowd}%</span>
                    </div>
                    <ProbabilityBar yes={crowd} height={6} />
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                    <span className="num text-[12px] text-muted">
                      Pool {formatEth(rm?.poolEth ?? 0, 2)} ETH · {rm?.entries ?? 0} entries
                    </span>
                    <Link
                      href="/#play"
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-fg-soft transition-colors hover:text-accent"
                    >
                      Make a call <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
