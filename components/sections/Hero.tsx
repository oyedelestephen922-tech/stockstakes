"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowDownRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { HeroCard } from "./HeroCard";
import { MarketTape } from "./MarketTape";
import { hero } from "@/data/site";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-terminal-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(80%_70%_at_30%_30%,black,transparent)]" />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-4 pb-16 pt-10 sm:px-6 md:pt-16 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16 lg:pb-24 lg:pt-20">
        <div className="min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="inline-flex items-center gap-2.5 rounded-full border border-line bg-panel/70 py-1.5 pl-2 pr-3.5 backdrop-blur"
          >
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative size-2 rounded-full bg-accent" />
            </span>
            <span className="font-mono text-[11.5px] tracking-wide text-fg-soft">{hero.status}</span>
          </motion.div>

          <h1 className="mt-7 text-[44px] font-semibold leading-[0.96] tracking-[-0.045em] text-fg min-[400px]:text-[50px] sm:text-[68px] lg:text-[78px] xl:text-[86px]">
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.05 }}
            >
              {hero.headline[0]}
            </motion.span>
            <motion.span
              className="block text-fg-soft"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.15 }}
            >
              Put your{" "}
              <span className="relative inline-block text-accent">
                stake
                <motion.span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 h-[3px] w-full origin-left rounded-full bg-gold sm:h-1"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.7, ease, delay: 0.75 }}
                />
              </span>{" "}
              behind it.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.3 }}
            className="mt-7 max-w-[34rem] text-pretty text-[16.5px] leading-relaxed text-fg-soft sm:text-[18px]"
          >
            {hero.body}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.4 }}
            className="mt-9 flex flex-col gap-3 min-[420px]:flex-row"
          >
            <ButtonLink href={hero.primaryCta.href} size="lg">
              {hero.primaryCta.label}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </ButtonLink>
            <ButtonLink href={hero.secondaryCta.href} size="lg" variant="secondary">
              {hero.secondaryCta.label}
              <ArrowDownRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
            </ButtonLink>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 max-w-[30rem] border-l-2 border-gold/50 pl-4 text-[13.5px] leading-relaxed text-muted"
          >
            {hero.secondary}
          </motion.p>
        </div>

        <div className="min-w-0">
          <HeroCard />
        </div>
      </div>
      <MarketTape />
    </section>
  );
}
