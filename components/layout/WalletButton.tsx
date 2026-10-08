"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LoaderCircle, Power, Wallet } from "lucide-react";
import { useWallet } from "@/providers/wallet-provider";
import { Button } from "@/components/ui/Button";
import { formatEth, shortAddress } from "@/lib/format";
import { cn } from "@/lib/cn";

export function WalletButton({
  className,
  full = false,
  compact = false,
}: {
  className?: string;
  full?: boolean;
  /** Small header version for phones. */
  compact?: boolean;
}) {
  const { status, session, walletName, openConnect, disconnect } = useWallet();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menu]);

  if (status === "connecting") {
    return (
      <Button variant="secondary" size="sm" disabled className={cn(full && "w-full", className)}>
        <LoaderCircle className="size-4 animate-spin" /> {compact ? "…" : "Awaiting wallet…"}
      </Button>
    );
  }

  if (!session) {
    return (
      <Button size="sm" onClick={openConnect} className={cn(full && "w-full", compact && "px-3", className)}>
        <Wallet className="size-4" /> {compact ? "Connect" : "Connect Wallet"}
      </Button>
    );
  }

  const isDemo = session.kind === "demo";
  const addr = isDemo ? (compact ? "Demo" : "Demo wallet") : compact ? `${(session.address ?? "").slice(0, 6)}…` : shortAddress(session.address ?? "");
  const bal = isDemo ? "No funds" : session.balanceEth === null ? "—" : `${formatEth(session.balanceEth, 4)} ETH`;

  return (
    <div ref={ref} className={cn("relative", full && "w-full", className)}>
      <button
        type="button"
        onClick={() => setMenu((m) => !m)}
        aria-expanded={menu}
        className={cn(
          "inline-flex h-9 items-center gap-2.5 rounded-[9px] border border-line-strong bg-panel pl-2 pr-2.5 text-[13px] transition-colors hover:border-fg/30",
          full && "w-full justify-between",
        )}
      >
        <span className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", isDemo ? "bg-gold" : "bg-accent")} />
          <span className="num font-medium text-fg">{addr}</span>
          {!compact && (
            <>
              <span className="h-4 w-px bg-line-strong" />
              <span className="num text-muted">{bal}</span>
            </>
          )}
        </span>
        <ChevronDown className="size-3.5 text-muted" />
      </button>
      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute right-0 z-50 rounded-xl border border-line-strong bg-panel p-3 shadow-2xl",
              full ? "bottom-[calc(100%+8px)] w-full" : "top-[calc(100%+8px)] w-64",
            )}
          >
            <span className="label">{isDemo ? "Demo session" : `Connected${walletName ? ` · ${walletName}` : ""}`}</span>
            <p className="mt-1.5 break-all font-mono text-xs text-fg-soft">
              {isDemo ? "Preview only. No address, no funds, no transactions." : session.address}
            </p>
            {!isDemo && session.chainId !== null && (
              <p className="mt-1 font-mono text-[11px] text-muted">Chain ID {session.chainId}</p>
            )}
            <button
              type="button"
              onClick={() => {
                disconnect();
                setMenu(false);
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-line py-2 text-[13px] text-fg-soft transition-colors hover:border-line-strong hover:text-fg"
            >
              <Power className="size-3.5" /> Disconnect
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
