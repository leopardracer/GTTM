import { clamp } from "../core/format.js";

export function progressBar(percent: number, width = 20): string {
  const pct = clamp(percent, 0, 100);
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  return `${"█".repeat(filled)}${"░".repeat(empty)} ${pct.toFixed(1)}%`;
}
