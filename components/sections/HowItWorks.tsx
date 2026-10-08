"use client";

import { motion } from "framer-motion";
import { Crosshair, Coins, Scale, ArrowDownToLine } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { steps } from "@/data/site";

const icons = [Crosshair, Coins, Scale, ArrowDownToLine];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-20 border-t border-line bg-bg-elev py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <SectionHeading
          index="02"
          eyebrow="How it works"
          title={
            <>
              Four steps.
              <br className="hidden sm:block" /> <span className="text-fg-soft">One hour.</span>
            </>
          }
          body="Every round follows the same transparent path from your call to settlement."
        />

        <ol className="relative grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = icons[i];
            return (
              <motion.li
                key={s.n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group relative flex flex-col bg-panel p-6 transition-colors hover:bg-panel-2 md:p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="num text-[44px] font-semibold leading-none tracking-tighter text-line-strong transition-colors group-hover:text-accent">
                    {s.n}
                  </span>
                  <span className="flex size-10 items-center justify-center rounded-[10px] border border-line text-fg-soft transition-colors group-hover:border-accent/40 group-hover:text-accent">
                    <Icon className="size-[18px]" />
                  </span>
                </div>
                <h3 className="mt-10 font-mono text-[13px] font-semibold uppercase tracking-[0.18em] text-fg">{s.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{s.body}</p>
                {i < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute right-0 top-1/2 hidden h-6 w-px -translate-y-1/2 bg-accent/60 lg:block"
                  />
                )}
              </motion.li>
            );
          })}
        </ol>

        {/* timeline of an hour */}
        <div className="mt-6 rounded-[var(--radius-card)] border border-line bg-panel px-5 py-5">
          <div className="flex items-center justify-between font-mono text-[11px] text-muted">
            <span>:00 Round opens</span>
            <span className="hidden sm:inline">Entries open all hour</span>
            <span>:60 Close → settle</span>
          </div>
          <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-panel-2">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent/30 via-accent to-gold"
              initial={{ width: "0%" }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
