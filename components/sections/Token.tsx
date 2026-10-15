"use client";

import { useState } from "react";

import { motion } from "framer-motion";
import { Check, Copy, ExternalLink, Lock } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Panel } from "@/components/ui/Panel";
import { LogoMark } from "@/components/brand/Logo";
import { token, tokenPillars } from "@/data/token";

export function Token() {
  const live = Boolean(token.contractAddress);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!token.contractAddress) return;
    try {
      await navigator.clipboard.writeText(token.contractAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the address is still selectable */
    }
  };

  return (
    <section id="token" className="relative scroll-mt-20 overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[900px] -translate-x-1/2 bg-[radial-gradient(closest-side,var(--gold-soft),transparent)]" />
      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div className="label mb-4 flex items-center gap-3">
              <span className="text-accent">05</span>
              <span className="h-px w-8 bg-line-strong" />
              <span className="text-gold">{token.symbol}</span>
            </div>
            <h2 className="text-balance text-[38px] font-semibold leading-[1] tracking-[-0.04em] sm:text-[52px] md:text-[60px]">
              One token.
              <br />
              <span className="text-fg-soft">One growing ecosystem.</span>
            </h2>
            <p className="mt-6 max-w-lg text-[16.5px] leading-relaxed text-fg-soft">{token.description}</p>

            <ul className="mt-8 space-y-0 divide-y divide-line border-y border-line">
              {tokenPillars.map((p) => (
                <li key={p.title} className="flex gap-5 py-4">
                  <span className="w-28 shrink-0 font-mono text-[11.5px] uppercase tracking-[0.16em] text-gold">{p.title}</span>
                  <span className="text-[14.5px] text-fg-soft">{p.body}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <Panel className="overflow-hidden">
              <div className="relative flex flex-col items-center px-6 pb-8 pt-10 text-center sm:px-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  className="pointer-events-none absolute top-6 size-[150px] rounded-full border border-dashed border-gold/25"
                />
                <div className="relative mt-[22px]">
                  <LogoMark size={88} conviction={1} />
                </div>
                <span className="num mt-8 text-[32px] font-semibold tracking-tight text-fg">{token.symbol}</span>

                <span className="label mt-8 block">{token.symbol} contract address</span>
                <div className="mt-3 w-full rounded-[12px] border border-dashed border-gold/40 bg-gold-soft px-4 py-5">
                  {live ? (
                    <span className="num block select-all break-all text-[15px] font-semibold leading-snug text-gold sm:text-[17px]">
                      {token.contractAddress}
                    </span>
                  ) : (
                    <span className="num block text-[22px] font-semibold uppercase tracking-[0.12em] text-gold sm:text-[26px]">Coming soon</span>
                  )}
                </div>
                <p className="mt-3 text-[13px] text-muted">
                  {live ? `Live on ${token.chain}. This is the only official $STAKES address.` : "Contract address will appear here once the token is live."}
                </p>

                {live ? (
                  <div className="mt-6 grid w-full grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={copy}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-accent-solid text-[14px] font-medium text-accent-ink transition-[filter] hover:brightness-110"
                    >
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy CA"}
                    </button>
                    <a
                      href={`https://robinhoodchain.blockscout.com/token/${token.contractAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-line-strong bg-panel-2 text-[14px] font-medium text-fg transition-colors hover:border-fg/40"
                    >
                      Explorer <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="mt-6 inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-[10px] border border-line-strong bg-panel-2 text-[14px] font-medium text-muted"
                  >
                    <Lock className="size-4" /> CA Coming Soon
                  </button>
                )}
              </div>
              <div className="border-t border-line bg-panel-2/60 px-6 py-3 text-center font-mono text-[10.5px] tracking-wide text-muted">
                Only trust the address published here. Beware of impersonators.
              </div>
            </Panel>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
