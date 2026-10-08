import { cn } from "@/lib/cn";
import type { DataSource, PositionStatus, RoundStatus } from "@/lib/types";

type Status = PositionStatus | RoundStatus | DataSource;

const styles: Record<string, { label: string; cls: string; dot?: string; pulse?: boolean }> = {
  open: { label: "Open", cls: "text-accent border-accent/30 bg-accent-soft", dot: "bg-accent", pulse: true },
  closed: { label: "Closed", cls: "text-muted border-line-strong bg-panel-2", dot: "bg-muted" },
  settling: { label: "Settling", cls: "text-gold border-gold/30 bg-gold-soft", dot: "bg-gold", pulse: true },
  settled: { label: "Settled", cls: "text-fg-soft border-line-strong bg-panel-2", dot: "bg-fg-soft" },
  pending: { label: "Pending", cls: "text-gold border-gold/30 bg-gold-soft", dot: "bg-gold", pulse: true },
  demo: { label: "Demo data", cls: "text-gold border-gold/30 bg-gold-soft", dot: "bg-gold" },
  "awaiting-wallet": { label: "Awaiting wallet", cls: "text-muted border-line-strong bg-panel-2", dot: "bg-muted" },
  unavailable: { label: "Not live", cls: "text-muted border-line-strong bg-panel-2", dot: "bg-muted" },
  api: { label: "Live API", cls: "text-accent border-accent/30 bg-accent-soft", dot: "bg-accent" },
  oracle: { label: "Oracle", cls: "text-accent border-accent/30 bg-accent-soft", dot: "bg-accent" },
};

export function StatusPill({ status, label, className }: { status: Status; label?: string; className?: string }) {
  const s = styles[status] ?? styles.closed;
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em]",
        s.cls,
        className,
      )}
    >
      {s.dot && (
        <span className="relative flex size-1.5">
          {s.pulse && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", s.dot)} />}
          <span className={cn("relative size-1.5 rounded-full", s.dot)} />
        </span>
      )}
      {label ?? s.label}
    </span>
  );
}
