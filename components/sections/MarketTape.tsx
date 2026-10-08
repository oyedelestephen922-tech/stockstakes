"use client";

import { useMarkets } from "@/providers/markets-provider";
import { MarketPrice } from "@/components/ui/MarketPrice";
import { cn } from "@/lib/cn";

/** Terminal-style live price tape under the hero. */
export function MarketTape() {
  const { markets, status } = useMarkets();

  return (
    <div className="relative border-y border-line bg-bg-elev">
      <div className="mx-auto flex max-w-[1240px] items-stretch overflow-x-auto px-4 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          className={cn(
            "label flex shrink-0 items-center gap-2 border-r border-line py-3.5 pr-5",
            status === "live" ? "text-accent" : "text-muted",
          )}
        >
          <span className={cn("size-1.5 rounded-full", status === "live" ? "animate-pulse bg-accent" : "bg-muted")} />
          {status === "live" ? "Live" : status === "loading" ? "Connecting" : "Feed offline"}
        </div>
        {markets.map((m) => (
          <div key={m.id} className="flex shrink-0 items-center gap-3 border-r border-line px-5 py-3.5 last:border-r-0">
            <span className="num text-[12.5px] font-semibold text-fg">{m.symbol}</span>
            {m.price !== null ? (
              <MarketPrice market={m} size="sm" />
            ) : (
              <span className="num text-[12px] text-muted">{status === "loading" ? "…" : "—"}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
