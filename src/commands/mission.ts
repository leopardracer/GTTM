import { config } from "../core/config.js";
import { readTokenInfo } from "../chain/token.js";
import { readLiquidity } from "../chain/liquidity.js";
import { readHolderStats } from "../chain/holders.js";
import { readActivityStats } from "../chain/transactions.js";
import { evaluateRoadmap } from "../core/roadmap.js";
import { fmtUsd, fmtToken, fmtNum, DATA_UNAVAILABLE } from "../core/format.js";
import { header, demoBanner, label, dim } from "../ui/terminal.js";
import { progressBar } from "../ui/progress.js";
import { demoSnapshot } from "../core/demo.js";
import * as scout from "../agents/scout.js";
import * as mouth from "../agents/mouth.js";
import * as door from "../agents/door.js";
import * as wrench from "../agents/wrench.js";
import * as abacus from "../agents/abacus.js";
import * as ears from "../agents/ears.js";

const crew = [scout, mouth, door, wrench, abacus, ears];

export async function runMission() {
  console.log(header("GROK TO THE MOON"));
  console.log();

  if (config.isDemo()) {
    console.log(demoBanner());
    console.log();
    console.log(label("MISSION", "IN PROGRESS (demo)"));
    console.log(label("CHAIN", "Robinhood Chain"));
    console.log(label("TOKEN", demoSnapshot.symbol));
    console.log();
    console.log(label("MARKET CAP", fmtUsd(demoSnapshot.marketCapUsd) + " (demo)"));
    console.log(label("LIQUIDITY", fmtUsd(demoSnapshot.liquidityUsd) + " (demo)"));
    console.log(label("HOLDERS", fmtNum(demoSnapshot.holders) + " (demo)"));
    console.log(label("VOLUME 24H", fmtUsd(demoSnapshot.volume24hUsd) + " (demo)"));

    const evalDemo = evaluateRoadmap(demoSnapshot.marketCapUsd);
    console.log();
    console.log(dim(`NEXT OBJECTIVE (demo)`));
    console.log(
      evalDemo.nextMilestone
        ? `$${evalDemo.nextMilestone.thresholdUsd.toLocaleString("en-US")} MARKET CAP (PHASE ${evalDemo.nextMilestone.phase.id}: ${evalDemo.nextMilestone.phase.name})`
        : "no further numeric milestone"
    );
    console.log();
    console.log(dim("DISTANCE TO OBJECTIVE"));
    if (evalDemo.nextMilestone) {
      console.log(progressBar((demoSnapshot.marketCapUsd / evalDemo.nextMilestone.thresholdUsd) * 100) + " (demo)");
    }
  } else {
    const [token, liquidity, holders, activity] = await Promise.all([
      readTokenInfo(),
      readLiquidity(),
      readHolderStats(),
      readActivityStats(),
    ]);

    // Market cap needs: totalSupply (token units) * priceInPair * usdPrice.
    // We already have liquidityUsd computed from usdPrice inside readLiquidity;
    // recompute the usd-per-token price the same way rather than duplicating
    // the price feed call.
    let marketCap: number | null = null;
    if (token.totalSupply && liquidity.priceInPair !== null && liquidity.liquidityUsd !== null && liquidity.liquidityPairAsset) {
      const usdPerPairAsset = liquidity.liquidityUsd / liquidity.liquidityPairAsset;
      const totalSupplyNum = Number(token.totalSupply) / 10 ** token.decimals;
      marketCap = totalSupplyNum * liquidity.priceInPair * usdPerPairAsset;
    }

    console.log(label("MISSION", token.contractExists ? "IN PROGRESS" : "AWAITING LAUNCH"));
    console.log(label("CHAIN", "Robinhood Chain"));
    console.log(label("TOKEN", token.symbol ?? "$GTTM"));
    console.log();
    console.log(label("MARKET CAP", fmtUsd(marketCap)));
    console.log(label("LIQUIDITY", liquidity.hasPool ? fmtUsd(liquidity.liquidityUsd) : DATA_UNAVAILABLE + (liquidity.graduated ? " (graduated, v4 pool read not implemented)" : " (no pool yet)")));
    console.log(label("HOLDERS", fmtNum(holders.holderCount) + (holders.isLifetime ? "" : dim("  (*windowed, no launch record found)"))));
    console.log(
      label(
        "VOLUME",
        liquidity.hasPool
          ? fmtToken(activity.buyVolumePairAsset + activity.sellVolumePairAsset, "ETH") + dim(" (lifetime on curve, not 24h)")
          : DATA_UNAVAILABLE
      )
    );

    const evaluation = evaluateRoadmap(marketCap);
    console.log();
    console.log(label("PHASE", `${evaluation.currentPhase.id} — ${evaluation.currentPhase.name}`));
    console.log();
    console.log(dim("NEXT OBJECTIVE"));
    console.log(
      evaluation.nextMilestone
        ? `$${evaluation.nextMilestone.thresholdUsd.toLocaleString("en-US")} MARKET CAP (PHASE ${evaluation.nextMilestone.phase.id}: ${evaluation.nextMilestone.phase.name})`
        : "no further numeric milestone in the roadmap — see `gttm moon`"
    );
    console.log();
    console.log(dim("DISTANCE TO OBJECTIVE"));
    if (!evaluation.nextMilestone) {
      console.log(dim("n/a — $2M already reached"));
    } else if (marketCap !== null) {
      console.log(progressBar((marketCap / evaluation.nextMilestone.thresholdUsd) * 100));
    } else {
      console.log(DATA_UNAVAILABLE + " — market cap could not be computed (missing pool, supply, or price feed)");
    }
  }

  console.log();
  console.log(dim("CREW"));
  for (const agent of crew) {
    console.log(`● ${agent.meta.name.padEnd(8)} ACTIVE`);
  }
  console.log();
  console.log("HUMAN".padEnd(10) + "ONLINE");
}
