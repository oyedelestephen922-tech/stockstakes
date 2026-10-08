import { cn } from "@/lib/cn";

/**
 * Neutral ticker tile. Deliberately avoids third-party logos — shows the
 * ticker in the brand's monospace instead.
 */
export function AssetGlyph({ symbol, className }: { symbol: string; className?: string }) {
  const short = symbol.length > 4 ? symbol.slice(0, 4) : symbol;
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-line-strong bg-panel-2 font-mono text-[10.5px] font-semibold tracking-wide text-fg",
        className,
      )}
    >
      {short}
    </span>
  );
}
