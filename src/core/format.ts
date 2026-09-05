export const DATA_UNAVAILABLE = "DATA UNAVAILABLE";

export function fmtUsd(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return DATA_UNAVAILABLE;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function fmtToken(n: number | null | undefined, symbol = "$GTTM"): string {
  if (n === null || n === undefined || Number.isNaN(n)) return DATA_UNAVAILABLE;
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${symbol}`;
}

export function fmtPercent(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return DATA_UNAVAILABLE;
  return `${n.toFixed(digits)}%`;
}

export function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return DATA_UNAVAILABLE;
  return n.toLocaleString("en-US");
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
