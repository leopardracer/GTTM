import { config } from "../core/config.js";
import { readLiquidity } from "../chain/liquidity.js";
import { readHolderStats } from "../chain/holders.js";
import { readActivityStats } from "../chain/transactions.js";
import { computeSignals } from "../core/signals.js";
import { readLastSnapshot, writeSnapshot } from "../core/state.js";
import { fmtToken, fmtNum, DATA_UNAVAILABLE } from "../core/format.js";
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
    holderCount: holders.holderCount,
    buyCount: activity.buyCount,
    sellCount: activity.sellCount,
    prevLiquidityPairAsset: prev?.liquidityPair,
    prevHolderCount: prev?.holderCount,
  });

  writeSnapshot({
    timestamp: Date.now(),
    liquidityPair: liquidity.liquidityPairAsset,
    holderCount: holders.holderCount,
    buybackTotal: prev?.buybackTotal ?? null,
  });

  return [
    `liquidity     ${liquidity.hasPool ? fmtToken(liquidity.liquidityPairAsset, "ETH") : DATA_UNAVAILABLE}`,
    `holders       ${fmtNum(holders.holderCount)}${holders.isLifetime ? "" : "  (*windowed, launch record not found)"}`,
    `curve         ${liquidity.graduated ? "graduated" : liquidity.hasPool ? `${liquidity.progressPercent?.toFixed(1)}% to graduation` : "n/a"}`,
    `24h activity  ${activity.buyCount} buys / ${activity.sellCount} sells`,
    ...signals.bullets.map((b) => `signal        ${b}`),
    `verdict       ${signals.verdict}`,
    `confidence    ${signals.confidence}/100`,
  ];
}
