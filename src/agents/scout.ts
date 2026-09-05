import { config } from "../core/config.js";
import { readLiquidity } from "../chain/liquidity.js";
import { readHolderStats } from "../chain/holders.js";
import { readActivityStats } from "../chain/transactions.js";
import { computeSignals } from "../core/signals.js";
import { readLastSnapshot, writeSnapshot } from "../core/state.js";
import { fmtToken, fmtNum, fmtPercent } from "../core/format.js";
import { demoSnapshot } from "../core/demo.js";

export const meta = { name: "SCOUT", role: "chain intelligence" };

export async function readout(): Promise<string[]> {
  if (config.isDemo()) {
    return [
      `liquidity     ${fmtToken(demoSnapshot.liquidityPair, "ETH")}`,
      `holders       ${fmtNum(demoSnapshot.holders)}`,
      `verdict       WATCH (demo)`,
      `confidence    50/100 (demo)`,
    ];
  }

  const [liquidity, holders, activity] = await Promise.all([
    readLiquidity(),
    readHolderStats(),
    readActivityStats(),
  ]);

  const prev = readLastSnapshot();
  const signals = computeSignals({
    liquidityPairAsset: liquidity.liquidityPairAsset,
    activeAddressesInWindow: holders.activeAddressesInWindow,
    buyCount: activity.buyCount,
    sellCount: activity.sellCount,
    prevLiquidityPairAsset: prev?.liquidityPair,
    prevActiveAddresses: prev?.activeHolders,
  });

  writeSnapshot({
    timestamp: Date.now(),
    liquidityPair: liquidity.liquidityPairAsset,
    activeHolders: holders.activeAddressesInWindow,
    buybackTotal: prev?.buybackTotal ?? null,
  });

  return [
    `liquidity     ${fmtToken(liquidity.liquidityPairAsset, "ETH")}`,
    `holders*      ${fmtNum(holders.activeAddressesInWindow)}  (*active in window, not lifetime)`,
    `24h activity  ${activity.buyCount} buys / ${activity.sellCount} sells`,
    ...signals.bullets.map((b) => `signal        ${b}`),
    `verdict       ${signals.verdict}`,
    `confidence    ${signals.confidence}/100`,
  ];
}
