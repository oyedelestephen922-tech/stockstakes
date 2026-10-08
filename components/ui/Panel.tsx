import { cn } from "@/lib/cn";

/**
 * StockStakes card: hairline border, near-black fill and four registration
 * ticks at the corners — the terminal "crop mark" signature of the brand.
 */
export function Panel({
  children,
  className,
  ticks = true,
  glow = false,
  as: Tag = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  ticks?: boolean;
  glow?: boolean;
  as?: "div" | "article" | "section" | "aside";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={cn(
        "relative rounded-[var(--radius-card)] border border-line bg-panel",
        glow && "shadow-[0_0_0_1px_var(--accent-soft),0_30px_80px_-30px_var(--glow)]",
        className,
      )}
      {...rest}
    >
      {ticks && <CornerTicks />}
      {children}
    </Tag>
  );
}

export function CornerTicks({ className }: { className?: string }) {
  const tick = "pointer-events-none absolute size-2.5 border-fg/30";
  return (
    <span aria-hidden="true" className={className}>
      <span className={cn(tick, "-left-px -top-px rounded-tl-[6px] border-l border-t")} />
      <span className={cn(tick, "-right-px -top-px rounded-tr-[6px] border-r border-t")} />
      <span className={cn(tick, "-bottom-px -left-px rounded-bl-[6px] border-b border-l")} />
      <span className={cn(tick, "-bottom-px -right-px rounded-br-[6px] border-b border-r")} />
    </span>
  );
}

export function Stat({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <span className="label block truncate">{label}</span>
      <span className={cn("num mt-1 block truncate text-[15px] font-medium text-fg", valueClassName)}>{value}</span>
    </div>
  );
}
