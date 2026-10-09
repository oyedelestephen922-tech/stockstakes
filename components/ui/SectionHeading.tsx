import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

/** Section header with a terminal-style index label: "02 — Live round". */
export function SectionHeading({
  index,
  eyebrow,
  title,
  body,
  align = "left",
  className,
  aside,
}: {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  aside?: React.ReactNode;
}) {
  return (
    <Reveal
      className={cn(
        "mb-10 flex flex-col gap-6 md:mb-14",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        <div className={cn("label mb-4 flex items-center gap-3", align === "center" && "justify-center")}>
          <span className="text-accent">{index}</span>
          <span className="h-px w-8 bg-line-strong" />
          <span>{eyebrow}</span>
        </div>
        <h2 className="text-balance text-[34px] font-semibold leading-[1.02] tracking-[-0.035em] text-fg sm:text-[44px] md:text-[52px]">
          {title}
        </h2>
        {body && <p className="mt-4 max-w-xl text-pretty text-[15.5px] leading-relaxed text-muted sm:text-base">{body}</p>}
      </div>
      {aside && <div className="shrink-0 self-start md:self-auto">{aside}</div>}
    </Reveal>
  );
}
