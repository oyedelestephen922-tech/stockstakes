import { formatPct, formatUsd } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Market } from "@/lib/types";

/**
 * A market's live price and change — or nothing at all when no price is
 * available. Never shows placeholder prices.
 */
export function MarketPrice({
  market,
  size = "md",
  showWindow = true,
  className,
}: {
  market: Market;
  size?: "sm" | "md" | "lg";
  showWindow?: boolean;
  className?: string;
}) {
  if (market.price === null) return null;
  const change = market.changePct;
  const up = (change ?? 0) >= 0;
  const priceCls =
    size === "lg" ? "text-[28px] font-semibold" : size === "md" ? "text-[22px] font-semibold" : "text-[12.5px] text-fg-soft";
  return (
    <span className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("num tracking-tight text-fg", priceCls)}>{formatUsd(market.price)}</span>
      {change !== null && (
        <span className={cn("num text-[12px] font-medium", up ? "text-accent" : "text-down")}>
          {formatPct(change, true)}
          {showWindow && <span className="ml-1 text-muted">{market.changeWindow}</span>}
        </span>
      )}
    </span>
  );
}

export function hasPriceHistory(market: Market): boolean {
  return market.history.length > 1;
}

/** Small "LIVE" / "MARKET CLOSED" tag for a market. */
export function MarketStateTag({ market, className }: { market: Market; className?: string }) {
  if (market.price === null || !market.marketState) return null;
  const closed = market.marketState === "closed";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.14em]",
        closed ? "text-muted" : "text-accent",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", closed ? "bg-muted" : "animate-pulse bg-accent")} />
      {closed ? "Market closed" : "Live"}
    </span>
  );
}
