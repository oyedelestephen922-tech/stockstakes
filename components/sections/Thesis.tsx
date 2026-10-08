"use client";

import { motion } from "framer-motion";
import { Target, Gauge, FileCheck } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Panel } from "@/components/ui/Panel";
import { thesis } from "@/data/site";

const icons = { calibration: Target, conviction: Gauge, settlement: FileCheck } as const;

/** Calibration curve: perfectly calibrated diagonal vs. a sharp caller. */
function CalibrationChart() {
  const pts = [
    [0, 100],
    [20, 84],
    [40, 62],
    [60, 41],
    [80, 19],
    [100, 2],
  ];
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x * 2.4 + 20} ${y * 1.4 + 10}`).join(" ");
  return (
    <svg viewBox="0 0 280 170" className="h-auto w-full" aria-label="Calibration chart: your calls tracking actual outcomes">
      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line x1={20} x2={260} y1={10 + t * 1.4} y2={10 + t * 1.4} stroke="var(--line)" strokeWidth={1} />
          <text x={4} y={14 + t * 1.4} fontSize={8} fill="var(--muted)" fontFamily="var(--font-mono)">
            {100 - t}
          </text>
        </g>
      ))}
      <line x1={20} y1={150} x2={260} y2={10} stroke="var(--line-strong)" strokeDasharray="3 4" />
      <motion.path
        d={d}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      {pts.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x * 2.4 + 20}
          cy={y * 1.4 + 10}
          r={3}
          fill="var(--panel)"
          stroke="var(--accent)"
          strokeWidth={1.5}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.15 }}
        />
      ))}
      <text x={260} y={166} textAnchor="end" fontSize={8} fill="var(--muted)" fontFamily="var(--font-mono)">
        YOUR PROBABILITY →
      </text>
    </svg>
  );
}

export function Thesis() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <Reveal>
            <div className="label mb-4 flex items-center gap-3">
              <span className="text-accent">03</span>
              <span className="h-px w-8 bg-line-strong" />
              <span>The thesis</span>
            </div>
            <h2 className="text-balance text-[40px] font-semibold leading-[0.98] tracking-[-0.04em] sm:text-[56px] md:text-[68px]">
              Conviction
              <br />
              has a <span className="text-gold">price.</span>
            </h2>
            <div className="mt-8 max-w-xl space-y-5 text-[16.5px] leading-relaxed text-fg-soft">
              {thesis.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <Panel className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="label">Calibration · illustrative</span>
                <span className="font-mono text-[10.5px] text-muted">
                  <span className="text-accent">●</span> your calls <span className="ml-2">┄</span> perfect
                </span>
              </div>
              <div className="mt-4">
                <CalibrationChart />
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-muted">
                A well-calibrated caller&apos;s 70% calls come true about 70% of the time. That edge — not luck — is
                what StockStakes rewards.
              </p>
            </Panel>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {thesis.features.map((f, i) => {
            const Icon = icons[f.key];
            return (
              <Reveal key={f.key} delay={i * 0.08}>
                <div className="group h-full rounded-[var(--radius-card)] border border-line bg-panel p-6 transition-colors hover:border-line-strong">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-[9px] bg-accent-soft text-accent">
                      <Icon className="size-[17px]" />
                    </span>
                    <h3 className="font-mono text-[12.5px] font-semibold uppercase tracking-[0.18em] text-fg">{f.title}</h3>
                  </div>
                  <p className="mt-5 text-[17px] font-medium leading-snug tracking-[-0.01em] text-fg-soft">{f.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
