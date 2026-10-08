import { formatPct, formatUsd } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Market } from "@/lib/types";

/**
 * Renders a market's live price and hourly change — or nothing at all when no
 * price feed is connected. No placeholder or demo prices are ever shown.
 */
export function MarketPrice({
  market,
  size = "md",
  className,
}: {
  market: Market;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (market.price === null) return null;
  const change = market.hourlyChangePct;
  const up = (change ?? 0) >= 0;
  const priceCls = size === "lg" ? "text-[28px] font-semibold" : size === "md" ? "text-[22px] font-semibold" : "text-[12px]";
  return (
    <span className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("num tracking-tight text-fg", priceCls)}>{formatUsd(market.price)}</span>
      {change !== null && (
        <span className={cn("num text-[12px] font-medium", up ? "text-accent" : "text-down")}>{formatPct(change, true)}</span>
      )}
    </span>
  );
}

export function hasPriceHistory(market: Market): boolean {
  return market.history.length > 1;
}
