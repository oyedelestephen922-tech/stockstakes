import type { Eip1193Provider } from "./types";

/**
 * Supported wallet apps.
 *
 * On mobile, browsers don't have wallet extensions, so connecting works by
 * opening StockStakes inside the wallet app's built-in browser (via the
 * wallet's official deep link). There the wallet injects its provider and the
 * normal connect flow runs. On desktop the browser extension is used directly.
 *
 * Deep link formats come from each wallet's developer docs:
 *  - MetaMask:        https://link.metamask.io/dapp/{host/path}
 *  - Coinbase Wallet: https://go.cb-w.com/dapp?cb_url={encoded url}
 *  - Trust Wallet:    https://link.trustwallet.com/open_url?coin_id=60&url={encoded url}
 */

export type WalletId = "metamask" | "coinbase" | "trust";

export interface WalletOption {
  id: WalletId;
  name: string;
  /** EIP-6963 reverse-DNS ids announced by the wallet. */
  rdns: string[];
  /** Brand tile colour + short mark (no third-party logos bundled). */
  color: string;
  mark: string;
  installUrl: string;
  deepLink: (pageUrl: URL) => string;
  /** Legacy window.ethereum flag check when EIP-6963 isn't available. */
  matchesLegacy: (p: LegacyFlags) => boolean;
}

export type LegacyFlags = Eip1193Provider & {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isTrust?: boolean;
  isTrustWallet?: boolean;
  isRabby?: boolean;
  isBraveWallet?: boolean;
  providers?: LegacyFlags[];
};

export const walletOptions: WalletOption[] = [
  {
    id: "metamask",
    name: "MetaMask",
    rdns: ["io.metamask", "io.metamask.mobile", "io.metamask.flask"],
    color: "#F6851B",
    mark: "MM",
    installUrl: "https://metamask.io/download/",
    deepLink: (u) => `https://link.metamask.io/dapp/${u.host}${u.pathname}${u.search}`,
    matchesLegacy: (p) => Boolean(p.isMetaMask && !p.isTrust && !p.isTrustWallet && !p.isRabby && !p.isBraveWallet && !p.isCoinbaseWallet),
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    rdns: ["com.coinbase.wallet"],
    color: "#0052FF",
    mark: "CB",
    installUrl: "https://www.coinbase.com/wallet/downloads",
    deepLink: (u) => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(u.toString())}`,
    matchesLegacy: (p) => Boolean(p.isCoinbaseWallet),
  },
  {
    id: "trust",
    name: "Trust Wallet",
    rdns: ["com.trustwallet.app"],
    color: "#0500FF",
    mark: "TW",
    installUrl: "https://trustwallet.com/download",
    deepLink: (u) => `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(u.toString())}`,
    matchesLegacy: (p) => Boolean(p.isTrust || p.isTrustWallet),
  },
];

/** Rough but reliable check for phones/tablets (incl. iPadOS desktop UA). */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(ua)) return true;
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}
