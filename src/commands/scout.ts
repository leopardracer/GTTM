import { config } from "../core/config.js";
import { readLiquidity } from "../chain/liquidity.js";
import { readHolderStats } from "../chain/holders.js";
import { readActivityStats } from "../chain/transactions.js";
import { computeSignals } from "../core/signals.js";
import { readLastSnapshot, writeSnapshot } from "../core/state.js";
import { fmtToken, fmtNum, DATA_UNAVAILABLE } from "../core/format.js";
import { header, label, dim, verdictColor } from "../ui/terminal.js";
import { demoSnapshot } from "../core/demo.js";
import { demoBanner } from "../ui/terminal.js";

export async function runScout() {
  console.log(header("SCOUT / ROBINHOOD CHAIN"));
  console.log();

  if (config.isDemo()) {
    console.log(demoBanner());
    console.log();
    console.log(label("TOKEN", demoSnapshot.symbol));
    console.log(label("LIQUIDITY", fmtToken(demoSnapshot.liquidityPair, "ETH") + " (demo)"));
    console.log(label("HOLDERS", fmtNum(demoSnapshot.holders) + " (demo)"));
    console.log();
    console.log(dim("RECENT SIGNALS"));
    console.log("* demo mode has no real signal history");
    console.log();
    console.log(label("SCOUT VERDICT", "WATCH (demo)"));
    console.log(label("CONFIDENCE", "50 / 100 (demo)"));
    return;
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

  console.log(label("TOKEN", "$GTTM"));
  console.log(label("LIQUIDITY", liquidity.hasPool ? fmtToken(liquidity.liquidityPairAsset, "ETH") : DATA_UNAVAILABLE));
  console.log(label("HOLDERS*", fmtNum(holders.activeAddressesInWindow)));
  console.log(label("24H ACTIVITY", `${activity.buyCount} buys / ${activity.sellCount} sells`));
  console.log(dim("  * active in window, not lifetime holder count"));
  console.log();
  console.log(dim("RECENT SIGNALS"));
  for (const b of signals.bullets) console.log(`* ${b}`);
  if (signals.rulesApplied.length > 0) {
    console.log(dim(`  (rules applied: ${signals.rulesApplied.join(", ")})`));
  }
  console.log();
  console.log(label("SCOUT VERDICT", verdictColor(signals.verdict)));
  console.log(label("CONFIDENCE", `${signals.confidence} / 100`));
}
