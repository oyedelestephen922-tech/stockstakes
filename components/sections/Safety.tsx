"use client";

import { BookOpen, ShieldCheck, FileText, Clock, Scale, KeyRound, TrendingDown, BadgeCheck, Ban } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { safety } from "@/data/site";

const icons = {
  rules: FileText,
  timing: Clock,
  settlement: Scale,
  approval: KeyRound,
  returns: TrendingDown,
  confirmations: BadgeCheck,
  addresses: Ban,
} as const;

export function Safety() {
  return (
    <section id="safety" className="relative scroll-mt-20 border-t border-line bg-bg-elev py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <SectionHeading
          index="06"
          eyebrow="Safety"
          title={safety.title}
          body={safety.intro}
          aside={
            <div className="flex flex-col gap-2 min-[420px]:flex-row">
              <ButtonLink href="/rules" variant="primary">
                <BookOpen className="size-4" /> Read the Rules
              </ButtonLink>
              <ButtonLink href="/safety" variant="secondary">
                <ShieldCheck className="size-4" /> Safety
              </ButtonLink>
            </div>
          }
        />

        <div className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {safety.principles.map((p, i) => {
            const Icon = icons[p.key];
            return (
              <div key={p.key} className="h-full bg-panel">
                <Reveal delay={(i % 4) * 0.05} className="flex h-full flex-col p-6">
                  <Icon className="size-[18px] text-accent" />
                  <h3 className="mt-6 text-[15.5px] font-semibold tracking-tight text-fg">{p.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">{p.body}</p>
                </Reveal>
              </div>
            );
          })}
          <div className="flex flex-col justify-between bg-panel-2 p-6">
            <span className="label">Status legend</span>
            <div className="mt-4 flex flex-wrap gap-1.5 font-mono text-[10.5px] uppercase tracking-wider">
              {["Demo", "Awaiting wallet", "Pending", "Open", "Closed", "Settling", "Settled"].map((s) => (
                <span key={s} className="rounded-full border border-line-strong px-2 py-1 text-fg-soft">
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-muted">
              &quot;Settled&quot; only appears once the chain says so.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
