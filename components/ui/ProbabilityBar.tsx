"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * Split bar: YES (accent) on the left, NO (muted) on the right. An optional
 * crowd marker shows where the room's average call sits.
 */
export function ProbabilityBar({
  yes,
  crowdYes,
  height = 8,
  className,
}: {
  yes: number;
  crowdYes?: number;
  height?: number;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative flex w-full overflow-hidden rounded-full bg-panel-2" style={{ height }}>
        <motion.div
          className="h-full rounded-l-full bg-accent"
          initial={false}
          animate={{ width: `${yes}%` }}
          transition={{ type: "spring", stiffness: 260, damping: 32 }}
        />
        <div className="h-full w-[2px] shrink-0 bg-bg" />
        <div className="h-full flex-1 rounded-r-full bg-line-strong" />
      </div>
      {crowdYes !== undefined && (
        <div
          className="pointer-events-none absolute -top-1 bottom-[-4px] w-px bg-gold"
          style={{ left: `${crowdYes}%` }}
          aria-hidden="true"
        >
          <span className="absolute -top-0.5 left-1/2 size-1.5 -translate-x-1/2 rotate-45 bg-gold" />
        </div>
      )}
    </div>
  );
}
