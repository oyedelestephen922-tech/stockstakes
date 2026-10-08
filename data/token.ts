import type { TokenInfo } from "@/lib/types";

/**
 * $STAKES token info.
 * `contractAddress` stays null until the token is deployed. The UI shows
 * "CA Coming Soon" wherever it is null — never put a placeholder address here.
 */
export const token: TokenInfo = {
  symbol: "$STAKES",
  name: "StockStakes",
  contractAddress: null,
  chain: null,
  description: "$STAKES is the native token powering the StockStakes ecosystem.",
};

export const tokenPillars = [
  {
    title: "Ecosystem",
    body: "The native asset of StockStakes, tied to the platform as it grows.",
  },
  {
    title: "Community",
    body: "Built for the people making calls every hour.",
  },
  {
    title: "Transparency",
    body: "The contract address is published here — and only here — once live.",
  },
] as const;
