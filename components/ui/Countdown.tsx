"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCountdown } from "@/hooks/use-countdown";
import { nextRoundClose } from "@/lib/round-clock";
import { pad2 } from "@/lib/format";
import { cn } from "@/lib/cn";

function Digit({ value }: { value: string }) {
  return (
    <span className="relative inline-flex h-[1em] w-[0.62em] justify-center overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "-70%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "70%", opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center leading-none"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * Round countdown. Defaults to the next hourly close; pass `getTarget` to
 * drive it from an on-chain close timestamp instead.
 */
export function Countdown({
  getTarget = (now: number) => nextRoundClose(now),
  label = "Round closes in",
  settlementLabel,
  size = "md",
  showProgress = true,
  className,
}: {
  getTarget?: (now: number) => number;
  label?: string;
  settlementLabel?: string;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  className?: string;
}) {
  const { remainingMs, minutes, seconds, progress } = useCountdown(getTarget);
  const text = remainingMs === null ? "--:--" : `${pad2(minutes)}:${pad2(seconds)}`;
  const sizeCls = size === "lg" ? "text-5xl" : size === "sm" ? "text-xl" : "text-3xl";
  const urgent = remainingMs !== null && remainingMs < 5 * 60 * 1000;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="label block">{label}</span>
          <div
            className={cn(
              "num mt-1.5 flex font-semibold tracking-tight",
              sizeCls,
              urgent ? "text-gold" : "text-fg",
            )}
            role="timer"
            aria-live="off"
            aria-label={remainingMs === null ? "Loading countdown" : `${minutes} minutes ${seconds} seconds`}
          >
            {text.split("").map((ch, i) =>
              ch === ":" ? (
                <span key={i} className="px-[0.04em] text-muted">
                  :
                </span>
              ) : (
                <Digit key={i} value={ch} />
              ),
            )}
          </div>
        </div>
        {settlementLabel && (
          <div className="text-right">
            <span className="label block">Settlement</span>
            <span className="mt-1.5 block text-sm font-medium text-fg-soft">{settlementLabel}</span>
          </div>
        )}
      </div>
      {showProgress && (
        <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-panel-2">
          <motion.div
            className={cn("h-full rounded-full", urgent ? "bg-gold" : "bg-fg/70")}
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.9, ease: "linear" }}
          />
        </div>
      )}
    </div>
  );
}
