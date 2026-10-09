"use client";

import { useMarkets } from "@/providers/markets-provider";
import { MarketPrice } from "@/components/ui/MarketPrice";
import { cn } from "@/lib/cn";
import type { Market } from "@/lib/types";

function TapeItem({ m, status }: { m: Market; status: "loading" | "live" | "unavailable" }) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-r border-line px-5 py-3.5">
      <span className="num text-[12.5px] font-semibold text-fg">{m.symbol}</span>
      {m.price !== null ? (
        <MarketPrice market={m} size="sm" />
      ) : (
        <span className="num text-[12px] text-muted">{status === "loading" ? "…" : "—"}</span>
      )}
    </div>
  );
}

/** Scrolling live price tape under the hero (pauses on hover). */
export function MarketTape() {
  const { markets, status } = useMarkets();

  return (
    <div className="relative flex items-stretch overflow-hidden border-y border-line bg-bg-elev">
      <div
        className={cn(
          "label relative z-10 flex shrink-0 items-center gap-2 border-r border-line bg-bg-elev py-3.5 pl-4 pr-5 sm:pl-6",
          status === "live" ? "text-accent" : "text-muted",
        )}
      >
        <span className={cn("size-1.5 rounded-full", status === "live" ? "animate-pulse bg-accent" : "bg-muted")} />
        {status === "live" ? "Live" : status === "loading" ? "Connecting" : "Feed offline"}
      </div>
      <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_40px,black_calc(100%-40px),transparent)]">
        <div className="tape-track flex w-max">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex" aria-hidden={copy === 1}>
              {markets.filter((m) => m.featured).map((m) => (
                <TapeItem key={`${copy}-${m.id}`} m={m} status={status} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
