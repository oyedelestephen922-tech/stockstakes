import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { TelegramIcon, XIcon } from "@/components/brand/SocialIcons";
import { footerLinks, site } from "@/data/site";
import { token } from "@/data/token";

function Social({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  const cls =
    "inline-flex h-10 items-center gap-2 rounded-[10px] border border-line px-3.5 text-[13px] text-fg-soft transition-colors";
  if (!href) {
    return (
      <span className={`${cls} cursor-not-allowed opacity-60`} title={`${label} — coming soon`}>
        {children} {label}
        <span className="font-mono text-[9.5px] uppercase tracking-wider text-muted">Soon</span>
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`${cls} hover:border-line-strong hover:text-fg`}>
      {children} {label}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-bg-elev">
      <div className="mx-auto max-w-[1240px] px-4 py-14 sm:px-6 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr]">
          <div>
            <Logo animated={false} size={34} />
            <p className="mt-5 max-w-sm text-[22px] font-semibold leading-tight tracking-[-0.03em] text-fg">
              {site.tagline}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Social href={site.social.x} label="X">
                <XIcon className="size-3.5" />
              </Social>
              <Social href={site.social.telegram} label="Telegram">
                <TelegramIcon className="size-4" />
              </Social>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {footerLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="py-1 text-[14px] text-fg-soft transition-colors hover:text-fg"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[12px]">
            <span className="text-muted">{token.symbol} CA:</span>
            <span className="rounded-md border border-dashed border-line-strong px-2 py-0.5 text-gold">
              {token.contractAddress ?? "Coming soon"}
            </span>
          </div>
          <p className="max-w-xl text-[11.5px] leading-relaxed text-muted md:text-right">
            Prices are live market data from public feeds and may be delayed. Staking opens when round contracts go
            live. Staking involves risk of loss. Nothing here is financial advice. © {new Date().getFullYear()} {site.name}.
          </p>
        </div>
      </div>
    </footer>
  );
}
