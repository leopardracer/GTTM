import { config } from "../core/config.js";
import { readTokenInfo } from "../chain/token.js";
import { readLiquidity } from "../chain/liquidity.js";
import { fmtUsd, DATA_UNAVAILABLE } from "../core/format.js";
import { header, label, dim, demoBanner } from "../ui/terminal.js";
import { progressBar } from "../ui/progress.js";
import { demoSnapshot } from "../core/demo.js";

export async function runMoon() {
  console.log(header("GTTM MISSION"));
  console.log();

  if (config.isDemo()) {
    console.log(demoBanner());
    console.log();
    console.log(label("CURRENT MCAP", fmtUsd(demoSnapshot.marketCapUsd) + " (demo)"));
    console.log(label("NEXT MILESTONE", `$${config.nextMilestoneUsd.toLocaleString("en-US")}`));
    console.log();
    console.log(dim("PROGRESS"));
    console.log(progressBar((demoSnapshot.marketCapUsd / config.nextMilestoneUsd) * 100) + " (demo)");
    return;
  }

  const [token, liquidity] = await Promise.all([readTokenInfo(), readLiquidity()]);

  let marketCap: number | null = null;
  if (token.totalSupply && liquidity.priceInPair !== null && liquidity.liquidityUsd !== null && liquidity.liquidityPairAsset) {
    const usdPerPairAsset = liquidity.liquidityUsd / liquidity.liquidityPairAsset;
    const totalSupplyNum = Number(token.totalSupply) / 10 ** token.decimals;
    marketCap = totalSupplyNum * liquidity.priceInPair * usdPerPairAsset;
  }

  console.log(label("CURRENT MCAP", fmtUsd(marketCap)));
  console.log(label("NEXT MILESTONE", `$${config.nextMilestoneUsd.toLocaleString("en-US")}`));
  console.log();
  console.log(dim("PROGRESS"));
  if (marketCap === null) {
    console.log(DATA_UNAVAILABLE + " — needs a live pool, total supply, and a USD price feed");
    return;
  }
  console.log(progressBar((marketCap / config.nextMilestoneUsd) * 100));
  console.log();
  const remaining = config.nextMilestoneUsd - marketCap;
  console.log(label("REMAINING", remaining > 0 ? fmtUsd(remaining) : "milestone reached"));
}
