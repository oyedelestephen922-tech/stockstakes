"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "./ThemeToggle";
import { WalletButton } from "./WalletButton";
import { navLinks } from "@/data/site";
import { useWallet } from "@/providers/wallet-provider";
import { cn } from "@/lib/cn";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { session } = useWallet();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled || open
          ? "border-line bg-bg/75 backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6 lg:h-[72px]">
        <Link href="/" aria-label="StockStakes home" onClick={() => setOpen(false)} className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <Logo />
        </Link>

        <ul className="hidden items-center rounded-[11px] border border-line bg-panel/60 p-1 lg:flex">
          {navLinks.map((l, i) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={cn(
                  "group flex items-center gap-1.5 rounded-[8px] px-3.5 py-1.5 text-[13.5px] font-medium text-fg-soft transition-colors hover:bg-panel-2 hover:text-fg",
                  l.label === "$STAKES" && "text-gold hover:text-gold",
                )}
              >
                <span className="font-mono text-[10px] text-muted transition-colors group-hover:text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <div className="hidden sm:block">
            <WalletButton />
          </div>
          {!open && (
            <div className="sm:hidden">
              <WalletButton compact />
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="inline-flex size-10 items-center justify-center rounded-[10px] border border-line bg-panel text-fg lg:hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "x" : "menu"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {open ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "calc(100dvh - 64px)", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line bg-bg lg:hidden"
          >
            <div className="flex h-full flex-col px-4 pb-8 pt-4 sm:px-6">
              <ul className="flex flex-col">
                {navLinks.map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04 }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between border-b border-line py-4 text-2xl font-semibold tracking-tight text-fg"
                    >
                      <span className={cn(l.label === "$STAKES" && "text-gold")}>{l.label}</span>
                      <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-auto flex items-center gap-2 pt-6">
                {/* Close the menu only when opening the connect dialog, so a connected user can still disconnect. */}
                <div className="flex-1" onClick={() => !session && setOpen(false)}>
                  <WalletButton full />
                </div>
                <ThemeToggle className="sm:hidden" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
