"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";
import { cn } from "@/lib/cn";
import { clamp } from "@/lib/format";

/**
 * Single-value probability control. The slider owns YES; NO is always
 * 100 − YES, so an invalid combination can't exist.
 */
export function ProbabilitySlider({
  yes,
  onChange,
  crowdYes,
  label = "Your probability",
  compact = false,
}: {
  yes: number;
  onChange: (yes: number) => void;
  crowdYes?: number;
  label?: string;
  compact?: boolean;
}) {
  const id = useId();
  const no = 100 - yes;
  const set = (v: number) => onChange(clamp(Math.round(v), 0, 100));

  return (
    <div className="w-full">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <label htmlFor={id} className="label block">
            {label}
          </label>
          <div className={cn("mt-1 flex items-baseline gap-1.5", compact ? "text-xl" : "text-2xl")}>
            <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-accent">Yes</span>
            <AnimatedNumber value={yes} format={(n) => `${Math.round(n)}%`} className="num font-semibold text-fg" />
          </div>
        </div>
        <div className="text-right">
          <span className="label block">Opposing</span>
          <div className={cn("mt-1 flex items-baseline justify-end gap-1.5", compact ? "text-xl" : "text-2xl")}>
            <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted">No</span>
            <AnimatedNumber value={no} format={(n) => `${Math.round(n)}%`} className="num font-semibold text-fg-soft" />
          </div>
        </div>
      </div>

      <div className="relative">
        {/* visual track */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex h-2 -translate-y-1/2 overflow-hidden rounded-full bg-line-strong">
          <motion.div
            className="h-full bg-accent"
            initial={false}
            animate={{ width: `${yes}%` }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
          />
        </div>
        {/* 25 / 50 / 75 ticks */}
        {[25, 50, 75].map((t) => (
          <span
            key={t}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 h-3.5 w-px -translate-y-1/2 bg-bg/80"
            style={{ left: `${t}%` }}
          />
        ))}
        {crowdYes !== undefined && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-[3px] size-1.5 -translate-x-1/2 rotate-45 bg-gold"
            style={{ left: `${crowdYes}%` }}
          />
        )}
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          step={1}
          value={yes}
          onChange={(e) => set(Number(e.target.value))}
          className="prob-range relative"
          aria-valuetext={`Yes ${yes} percent, No ${no} percent`}
        />
      </div>

      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted">
        <span>0%</span>
        {crowdYes !== undefined ? (
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rotate-45 bg-gold" /> Room avg {crowdYes}%
          </span>
        ) : (
          <span>50%</span>
        )}
        <span>100%</span>
      </div>
    </div>
  );
}
