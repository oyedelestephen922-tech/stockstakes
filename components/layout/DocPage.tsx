import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Shared layout for long-form pages like Rules and Safety. */
export function DocPage({
  eyebrow,
  title,
  intro,
  sections,
  note,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: { title: string; body: string[] }[];
  note?: string;
}) {
  return (
    <div className="relative">
      <div className="bg-terminal-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(black,transparent)]" />
      <article className="relative mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6 md:pt-20">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-fg">
          <ArrowLeft className="size-3.5" /> Back to StockStakes
        </Link>
        <div className="label mt-10 flex items-center gap-3">
          <span className="h-px w-8 bg-accent" />
          {eyebrow}
        </div>
        <h1 className="mt-4 text-[40px] font-semibold leading-[1] tracking-[-0.04em] sm:text-[56px]">{title}</h1>
        <p className="mt-6 text-[17px] leading-relaxed text-fg-soft">{intro}</p>
        {note && (
          <p className="mt-6 rounded-[12px] border border-gold/30 bg-gold-soft px-4 py-3 text-[13.5px] leading-relaxed text-fg-soft">
            {note}
          </p>
        )}

        <ol className="mt-12 divide-y divide-line border-y border-line">
          {sections.map((s, i) => (
            <li key={s.title} className="grid gap-3 py-8 sm:grid-cols-[72px_1fr]">
              <span className="num text-[13px] text-accent">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h2 className="text-[20px] font-semibold tracking-tight">{s.title}</h2>
                <div className="mt-3 space-y-3 text-[15.5px] leading-relaxed text-muted">
                  {s.body.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </article>
    </div>
  );
}
