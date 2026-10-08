"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { connectInjected, getInjectedProvider, readBalanceEth, readChainId } from "@/lib/web3/injected";
import { useDiscoveredWallets, type DiscoveredWallet } from "@/lib/web3/eip6963";
import { isMobileDevice, walletOptions, type LegacyFlags, type WalletOption } from "@/lib/web3/wallets";
import type { Eip1193Provider, WalletSession, WalletStatus } from "@/lib/web3/types";

/** A wallet the dialog can show, with its provider if it is available here. */
export interface WalletChoice {
  key: string;
  name: string;
  /** Wallet-supplied icon (EIP-6963) when available. */
  icon?: string;
  option?: WalletOption;
  provider: Eip1193Provider | null;
}

interface WalletContextValue {
  status: WalletStatus;
  session: WalletSession | null;
  /** Name of the wallet in use, e.g. "MetaMask". */
  walletName: string | null;
  error: string | null;
  isMobile: boolean;
  /** MetaMask, Coinbase Wallet, Trust Wallet — always listed. */
  featured: WalletChoice[];
  /** Other wallets detected in this browser (Rabby, Brave, …). */
  others: WalletChoice[];
  hasAnyProvider: boolean;
  dialogOpen: boolean;
  connectingKey: string | null;
  openConnect: () => void;
  closeConnect: () => void;
  connectWith: (choice: WalletChoice) => Promise<void>;
  startDemo: () => void;
  disconnect: () => void;
  isReady: boolean; // connected or demo
}

const WalletContext = createContext<WalletContextValue | null>(null);

function legacyProviders(): LegacyFlags[] {
  const eth = getInjectedProvider() as LegacyFlags | null;
  if (!eth) return [];
  return eth.providers?.length ? eth.providers : [eth];
}

function resolveChoices(discovered: DiscoveredWallet[]) {
  const legacy = legacyProviders();
  const used = new Set<string>();

  const featured: WalletChoice[] = walletOptions.map((option) => {
    const found = discovered.find((d) => option.rdns.includes(d.info.rdns));
    if (found) {
      used.add(found.info.uuid);
      return { key: option.id, name: option.name, icon: found.info.icon, option, provider: found.provider };
    }
    const legacyMatch = discovered.length === 0 ? legacy.find((p) => option.matchesLegacy(p)) : undefined;
    return { key: option.id, name: option.name, option, provider: legacyMatch ?? null };
  });

  const others: WalletChoice[] = discovered
    .filter((d) => !used.has(d.info.uuid))
    .map((d) => ({ key: d.info.uuid, name: d.info.name, icon: d.info.icon, provider: d.provider }));

  // An injected wallet that announced nothing and matched nothing.
  if (discovered.length === 0 && legacy.length > 0 && !featured.some((f) => f.provider)) {
    others.push({ key: "injected", name: "Browser wallet", provider: legacy[0] });
  }

  return { featured, others };
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const discovered = useDiscoveredWallets();
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [session, setSession] = useState<WalletSession | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<Eip1193Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [connectingKey, setConnectingKey] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [legacyTick, setLegacyTick] = useState(0);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    // Some in-app wallet browsers inject a moment after load.
    const t = window.setTimeout(() => setLegacyTick((n) => n + 1), 600);
    return () => window.clearTimeout(t);
  }, []);

  const { featured, others } = useMemo(
    () => (typeof window === "undefined" ? { featured: [], others: [] } : resolveChoices(discovered)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [discovered, legacyTick, dialogOpen],
  );
  const hasAnyProvider = featured.some((f) => f.provider) || others.length > 0;

  const connectWith = useCallback(
    async (choice: WalletChoice) => {
      setError(null);

      if (!choice.provider) {
        // Not available in this browser.
        if (choice.option) {
          if (isMobile) {
            // Open this page inside the wallet app's browser.
            window.location.href = choice.option.deepLink(new URL(window.location.href));
          } else {
            window.open(choice.option.installUrl, "_blank", "noopener,noreferrer");
          }
        }
        return;
      }

      setStatus("connecting");
      setConnectingKey(choice.key);
      try {
        const s = await connectInjected(choice.provider);
        setSession(s);
        setWalletName(choice.name);
        setActiveProvider(choice.provider);
        setStatus("connected");
        setDialogOpen(false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? "Connection failed.");
        setError(/reject|denied|cancel/i.test(msg) ? "Connection request was rejected in your wallet." : msg);
        setStatus("error");
      } finally {
        setConnectingKey(null);
      }
    },
    [isMobile],
  );

  const startDemo = useCallback(() => {
    setSession({ kind: "demo", address: null, chainId: null, balanceEth: null });
    setWalletName("Demo");
    setActiveProvider(null);
    setStatus("demo");
    setError(null);
    setDialogOpen(false);
  }, []);

  const disconnect = useCallback(() => {
    setSession(null);
    setWalletName(null);
    setActiveProvider(null);
    setStatus("disconnected");
    setError(null);
  }, []);

  // Keep a real session in sync with the wallet that was used.
  useEffect(() => {
    const provider = activeProvider;
    if (!provider?.on || session?.kind !== "injected") return;

    const onAccounts = async (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (!accounts?.length) {
        disconnect();
        return;
      }
      const address = accounts[0];
      const [balanceEth, chainId] = await Promise.all([readBalanceEth(provider, address), readChainId(provider)]);
      setSession({ kind: "injected", address, balanceEth, chainId });
    };
    const onChain = async () => {
      const address = session.address;
      if (!address) return;
      const [balanceEth, chainId] = await Promise.all([readBalanceEth(provider, address), readChainId(provider)]);
      setSession((s) => (s ? { ...s, balanceEth, chainId } : s));
    };

    provider.on("accountsChanged", onAccounts);
    provider.on("chainChanged", onChain);
    return () => {
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, [activeProvider, session?.kind, session?.address, disconnect]);

  const value = useMemo<WalletContextValue>(
    () => ({
      status,
      session,
      walletName,
      error,
      isMobile,
      featured,
      others,
      hasAnyProvider,
      dialogOpen,
      connectingKey,
      openConnect: () => {
        setError(null);
        if (status === "error") setStatus("disconnected");
        setDialogOpen(true);
      },
      closeConnect: () => setDialogOpen(false),
      connectWith,
      startDemo,
      disconnect,
      isReady: status === "connected" || status === "demo",
    }),
    [status, session, walletName, error, isMobile, featured, others, hasAnyProvider, dialogOpen, connectingKey, connectWith, startDemo, disconnect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
