"use client";

import { ChevronRight } from "lucide-react";
import { MarketPrice, MarketStateTag } from "@/components/ui/MarketPrice";
import { cn } from "@/lib/cn";
import type { Market } from "@/lib/types";

/** Compact market row in the live round board. Click to open the full call card. */
export function MarketRow({
  market,
  yes,
  priceStatus,
  onSelect,
}: {
  market: Market;
  yes: number;
  priceStatus: "loading" | "live" | "unavailable";
  onSelect: () => void;
}) {
  const side = yes >= 50 ? "YES" : "NO";
  const conviction = Math.max(yes, 100 - yes);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-[12px] border border-line bg-panel px-4 py-3.5 text-left transition-colors hover:border-line-strong hover:bg-panel-2 sm:grid-cols-[minmax(0,1fr)_auto_92px_auto] sm:gap-5"
    >
      <span className="min-w-0">
        <span className="flex items-baseline gap-2">
          <span className="num text-[14px] font-semibold tracking-tight text-fg">{market.symbol}</span>
          <MarketStateTag market={market} className="hidden min-[420px]:inline-flex" />
        </span>
        <span className="block truncate text-[13px] text-muted">{market.name}</span>
      </span>

      <span className="text-right">
        {market.price !== null ? (
          <MarketPrice market={market} size="sm" showWindow={false} className="flex-col items-end gap-0 sm:flex-row sm:items-baseline sm:gap-2" />
        ) : priceStatus === "loading" ? (
          <span className="inline-block h-4 w-16 animate-pulse rounded bg-panel-2" />
        ) : (
          <span className="num text-[12px] text-muted">—</span>
        )}
      </span>

      <span className="hidden sm:block">
        <span className="flex items-center justify-between font-mono text-[10.5px]">
          <span className={side === "YES" ? "text-accent" : "text-fg-soft"}>{side}</span>
          <span className="text-fg-soft">{conviction}%</span>
        </span>
        <span className="mt-1 block h-1 overflow-hidden rounded-full bg-line-strong">
          <span className={cn("block h-full rounded-full", side === "YES" ? "bg-accent" : "bg-fg-soft")} style={{ width: `${yes}%` }} />
        </span>
      </span>

      <ChevronRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
    </button>
  );
}
