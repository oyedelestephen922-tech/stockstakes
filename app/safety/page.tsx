import type { Metadata } from "next";
import { DocPage } from "@/components/layout/DocPage";
import { safetyPage } from "@/data/legal";

export const metadata: Metadata = {
  title: "Safety",
  description: "What to know before staking on StockStakes: risk, approvals, confirmations and the $STAKES contract address.",
};

export default function SafetyPage() {
  return <DocPage {...safetyPage} />;
}
