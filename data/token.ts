import type { TokenInfo } from "@/lib/types";

/**
 * $STAKES token info.
 * `contractAddress` stays null until the token is deployed. The UI shows
 * "CA Coming Soon" wherever it is null — never put a placeholder address here.
 */
export const token: TokenInfo = {
  symbol: "$STAKES",
  name: "StockStakes",
  contractAddress: "0x5fdd55212ec2D224345e52BB258AEe916bC39f65",
  chain: "Robinhood Chain",
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
    body: "The official contract address is published here and on @StockStakes. Nowhere else.",
  },
] as const;
