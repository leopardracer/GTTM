import { config } from "../core/config.js";
import { readBuybackStats } from "../chain/transactions.js";
import { fmtToken } from "../core/format.js";
import { demoSnapshot } from "../core/demo.js";

export const meta = { name: "ABACUS", role: "treasury + economics" };

export async function readout(): Promise<string[]> {
  if (config.isDemo()) {
    return [
      `buybacks (24h)  ${fmtToken(demoSnapshot.buyback24hUsd / 100, "ETH")} (demo)`,
      `verdict         HEALTHY (demo)`,
    ];
  }

  const buyback = await readBuybackStats();

  if (!buyback.configured) {
    return [
      "BUYBACK_WALLET is not configured — set it in .env to track roadmap",
      "Phase 3 (\"every fee goes back in\") on-chain instead of by claim.",
    ];
  }

  return [
    `buyback transfers (window)  ${buyback.count}`,
    `buyback total (window)      ${fmtToken(buyback.total)}`,
    buyback.count > 0 ? "verdict                      ACTIVE" : "verdict                      QUIET",
  ];
}
