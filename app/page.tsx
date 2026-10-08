import { Hero } from "@/components/sections/Hero";
import { LiveRound } from "@/components/dashboard/LiveRound";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Thesis } from "@/components/sections/Thesis";
import { Markets } from "@/components/sections/Markets";
import { Token } from "@/components/sections/Token";
import { Safety } from "@/components/sections/Safety";

export default function HomePage() {
  return (
    <>
      <Hero />
      <LiveRound />
      <HowItWorks />
      <Thesis />
      <Markets />
      <Token />
      <Safety />
    </>
  );
}
