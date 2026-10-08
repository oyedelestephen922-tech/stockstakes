"use client";

import { useEffect, useState } from "react";
import type { Eip1193Provider } from "./types";

/**
 * EIP-6963 multi-wallet discovery: every installed wallet announces itself
 * (name, icon, rdns) so users can pick one, instead of whichever extension
 * grabbed window.ethereum first.
 */
export interface Eip6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string; // data URI provided by the wallet itself
  rdns: string;
}

export interface DiscoveredWallet {
  info: Eip6963ProviderInfo;
  provider: Eip1193Provider;
}

interface AnnounceEvent extends Event {
  detail: DiscoveredWallet;
}

export function useDiscoveredWallets(): DiscoveredWallet[] {
  const [wallets, setWallets] = useState<DiscoveredWallet[]>([]);

  useEffect(() => {
    const onAnnounce = (event: Event) => {
      const { detail } = event as AnnounceEvent;
      if (!detail?.info?.uuid || !detail.provider) return;
      setWallets((prev) => (prev.some((w) => w.info.uuid === detail.info.uuid) ? prev : [...prev, detail]));
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    return () => window.removeEventListener("eip6963:announceProvider", onAnnounce);
  }, []);

  return wallets;
}
