"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronRight, Download, Eye, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { useWallet, type WalletChoice } from "@/providers/wallet-provider";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/brand/Logo";
import { cn } from "@/lib/cn";

function WalletTile({ choice }: { choice: WalletChoice }) {
  if (choice.icon) {
    // Icon supplied by the installed wallet itself (EIP-6963).
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={choice.icon} alt="" className="size-10 shrink-0 rounded-[10px] bg-panel-2 object-contain p-1" />;
  }
  const color = choice.option?.color;
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-[10px] font-mono text-[12px] font-bold tracking-wide text-white"
      style={{ background: color ?? "var(--line-strong)" }}
      aria-hidden="true"
    >
      {choice.option?.mark ?? choice.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function WalletRow({ choice }: { choice: WalletChoice }) {
  const { connectWith, connectingKey, isMobile } = useWallet();
  const connecting = connectingKey === choice.key;
  const busy = connectingKey !== null;

  let hint: string;
  let action: React.ReactNode;
  if (choice.provider) {
    hint = connecting ? "Approve the request in your wallet…" : "Detected · tap to connect";
    action = connecting ? <LoaderCircle className="size-4 animate-spin text-accent" /> : <ChevronRight className="size-4 text-muted" />;
  } else if (isMobile) {
    hint = `Open StockStakes in the ${choice.name} app`;
    action = <ArrowUpRight className="size-4 text-muted" />;
  } else {
    hint = "Not installed — get the extension";
    action = <Download className="size-4 text-muted" />;
  }

  return (
    <button
      type="button"
      onClick={() => connectWith(choice)}
      disabled={busy && !connecting}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors disabled:opacity-50",
        choice.provider ? "border-line-strong bg-panel-2 hover:border-accent/50" : "border-line hover:border-line-strong",
      )}
    >
      <WalletTile choice={choice} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-fg">{choice.name}</span>
        <span className={cn("block truncate text-xs", choice.provider && !connecting ? "font-medium text-fg-soft" : "text-muted")}>{hint}</span>
      </span>
      {action}
    </button>
  );
}

export function WalletDialog() {
  const { dialogOpen, closeConnect, startDemo, featured, others, error, isMobile, hasAnyProvider } = useWallet();

  useEffect(() => {
    if (!dialogOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeConnect();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [dialogOpen, closeConnect]);

  return (
    <AnimatePresence>
      {dialogOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeConnect}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-dialog-title"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-line-strong bg-panel p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl sm:p-6"
          >
            <div className="flex items-start justify-between">
              <LogoMark size={34} />
              <button
                type="button"
                onClick={closeConnect}
                aria-label="Close"
                className="inline-flex size-10 items-center justify-center rounded-lg text-muted hover:bg-panel-2 hover:text-fg"
              >
                <X className="size-4" />
              </button>
            </div>
            <h2 id="wallet-dialog-title" className="mt-4 text-xl font-semibold tracking-tight">
              Connect a wallet
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {isMobile && !hasAnyProvider
                ? "Pick your wallet app. StockStakes opens inside it so you can connect securely."
                : "StockStakes reads your address and ETH balance. Every stake needs a transaction you approve."}
            </p>

            <div className="mt-5 space-y-2">
              {featured.map((c) => (
                <WalletRow key={c.key} choice={c} />
              ))}
            </div>

            {others.length > 0 && (
              <>
                <span className="label mt-5 block">Other detected wallets</span>
                <div className="mt-2 space-y-2">
                  {others.map((c) => (
                    <WalletRow key={c.key} choice={c} />
                  ))}
                </div>
              </>
            )}

            {error && <p className="mt-4 rounded-lg border border-down/30 bg-down-soft px-3 py-2 text-xs text-down">{error}</p>}

            <button
              type="button"
              onClick={startDemo}
              className="mt-4 flex w-full items-center gap-3 rounded-xl border border-dashed border-line p-3 text-left transition-colors hover:border-gold/50"
            >
              <span className="flex size-10 items-center justify-center rounded-[10px] bg-gold-soft text-gold">
                <Eye className="size-[18px]" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-fg">Preview in demo mode</span>
                <span className="block text-xs text-muted">No address, no funds, nothing sent.</span>
              </span>
            </button>

            <div className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-[11.5px] text-muted">
              <ShieldCheck className="size-3.5 shrink-0 text-accent" />
              StockStakes never asks for your seed phrase.
            </div>
            <Button variant="ghost" size="sm" onClick={closeConnect} className="mt-2 w-full sm:hidden">
              Cancel
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
