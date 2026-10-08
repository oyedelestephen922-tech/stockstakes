"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * StockStakes mark: a probability gauge (green arc, filled to a call) wrapping
 * a rising market line that ends on a gold stake marker — the point where you
 * plant your conviction.
 */
export function LogoMark({
  size = 32,
  animated = true,
  className,
  conviction = 0.72,
}: {
  size?: number;
  animated?: boolean;
  className?: string;
  conviction?: number;
}) {
  const circumference = 2 * Math.PI * 11;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="8.5" fill="var(--panel-2)" stroke="var(--line-strong)" strokeWidth="1" />
      {/* gauge track */}
      <circle cx="16" cy="16" r="11" stroke="var(--line-strong)" strokeWidth="1.6" />
      {/* gauge fill = conviction */}
      <motion.circle
        cx="16"
        cy="16"
        r="11"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
        transform="rotate(-90 16 16)"
        strokeDasharray={circumference}
        initial={animated ? { strokeDashoffset: circumference } : false}
        animate={{ strokeDashoffset: circumference * (1 - conviction) }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      />
      {/* rising market line */}
      <motion.path
        d="M9.5 20.2 L13 16.6 L16 18.6 L21.4 12.6"
        stroke="var(--fg)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: "easeOut", delay: 0.35 }}
      />
      {/* stake post */}
      <motion.line
        x1="21.4"
        y1="12.6"
        x2="21.4"
        y2="22.6"
        stroke="var(--gold)"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={animated ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.1 }}
      />
      {/* stake marker */}
      <motion.rect
        x="19.6"
        y="8.4"
        width="3.6"
        height="3.6"
        rx="0.6"
        fill="var(--gold)"
        transform="rotate(45 21.4 10.2)"
        initial={animated ? { scale: 0, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        style={{ transformOrigin: "21.4px 10.2px", transformBox: "view-box" }}
        transition={{ type: "spring", stiffness: 420, damping: 18, delay: 1.25 }}
      />
    </svg>
  );
}

export function Logo({
  size = 30,
  animated = true,
  className,
}: {
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} animated={animated} />
      <span className="text-[17px] leading-none tracking-[-0.03em]">
        <span className="font-medium text-fg-soft">Stock</span>
        <span className="font-bold text-fg">Stakes</span>
      </span>
    </span>
  );
}
