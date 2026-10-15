import type { Metadata } from "next";
import { DocPage } from "@/components/layout/DocPage";
import { rulesPage } from "@/data/legal";
import { contracts, contractsLive } from "@/lib/web3/contracts";
import { addressUrl, targetChain } from "@/lib/web3/chain";

export const metadata: Metadata = {
  title: "Rules",
  description: "How StockStakes hourly prediction rounds open, close, settle and pay out.",
};

export default function RulesPage() {
  const sections = contractsLive
    ? [
        ...rulesPage.sections,
        {
          title: "Contracts",
          body: [
            `Round contract (StakesRounds) on ${targetChain.name}: ${contracts.stakesRounds}${addressUrl(contracts.stakesRounds!) ? ` — ${addressUrl(contracts.stakesRounds!)}` : ""}`,
            `Price contract (StakesOracle): ${contracts.stakesOracle}${addressUrl(contracts.stakesOracle!) ? ` — ${addressUrl(contracts.stakesOracle!)}` : ""}`,
          ],
        },
      ]
    : rulesPage.sections;
  return <DocPage {...rulesPage} sections={sections} note={contractsLive ? undefined : rulesPage.note} />;
}
