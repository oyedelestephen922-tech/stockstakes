import type { Metadata } from "next";
import { DocPage } from "@/components/layout/DocPage";
import { rulesPage } from "@/data/legal";

export const metadata: Metadata = {
  title: "Rules",
  description: "How StockStakes hourly prediction rounds open, close, settle and pay out.",
};

export default function RulesPage() {
  return <DocPage {...rulesPage} />;
}
