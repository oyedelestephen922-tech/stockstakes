export function formatEth(value: number, maxDecimals = 4): string {
  if (!Number.isFinite(value)) return "0";
  const fixed = value.toFixed(maxDecimals);
  // trim trailing zeros but keep at least 3 decimals for small amounts
  const trimmed = fixed.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
  const [int, dec = ""] = trimmed.split(".");
  const padded = dec.length < 3 && value < 1 ? dec.padEnd(3, "0") : dec;
  return padded ? `${int}.${padded}` : int;
}

export function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPct(value: number, withSign = false): string {
  const s = Math.abs(value).toFixed(2);
  if (!withSign) return `${s}%`;
  return `${value >= 0 ? "+" : "−"}${s}%`;
}

export function formatRoundId(id: number): string {
  return `#${id.toLocaleString("en-US")}`;
}

export function shortAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}
