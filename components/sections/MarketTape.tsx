import { getMarkets } from "@/data/markets";
import { getRoundMarket } from "@/data/rounds";
import { MarketPrice } from "@/components/ui/MarketPrice";

/** Terminal-style tape under the hero. Data comes from the markets feed. */
export function MarketTape() {
  const markets = getMarkets();
  const items = markets.map((m) => ({ m, crowd: getRoundMarket(m.id)?.crowdYes ?? 50 }));

  return (
    <div className="relative border-y border-line bg-bg-elev">
      <div className="mx-auto flex max-w-[1240px] items-stretch overflow-x-auto px-4 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="label flex shrink-0 items-center gap-2 border-r border-line py-3.5 pr-5 text-gold">
          <span className="size-1.5 rotate-45 bg-gold" /> Room odds
        </div>
        {items.map(({ m, crowd }) => {
          return (
            <div key={m.id} className="flex shrink-0 items-center gap-4 border-r border-line px-5 py-3.5 last:border-r-0">
              <span className="num text-[12.5px] font-semibold text-fg">{m.symbol}</span>
              <MarketPrice market={m} size="sm" />
              <span className="num text-[12px] text-fg-soft">
                <span className="text-accent">{crowd}%</span> YES
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
