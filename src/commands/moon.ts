import { config } from "../core/config.js";
import { readTokenInfo } from "../chain/token.js";
import { readLiquidity } from "../chain/liquidity.js";
import { evaluateRoadmap } from "../core/roadmap.js";
import { fmtUsd, DATA_UNAVAILABLE } from "../core/format.js";
import { header, label, dim, demoBanner } from "../ui/terminal.js";
import { progressBar } from "../ui/progress.js";
import { demoSnapshot } from "../core/demo.js";

function statusTag(status: "done" | "running" | "pending"): string {
  if (status === "done") return "DONE";
  if (status === "running") return "RUNNING";
  return "PENDING";
}

export async function runMoon() {
  console.log(header("GTTM MISSION"));
  console.log();

  if (config.isDemo()) {
    console.log(demoBanner());
    console.log();
    const evalDemo = evaluateRoadmap(demoSnapshot.marketCapUsd);
    console.log(label("CURRENT MCAP", fmtUsd(demoSnapshot.marketCapUsd) + " (demo)"));
    console.log(label("CURRENT PHASE", `${evalDemo.currentPhase.id} — ${evalDemo.currentPhase.name} (${statusTag(evalDemo.currentPhase.status)}) (demo)`));
    if (evalDemo.nextMilestone) {
      console.log();
      console.log(dim(`PROGRESS TO $${evalDemo.nextMilestone.thresholdUsd.toLocaleString("en-US")} (PHASE ${evalDemo.nextMilestone.phase.id})`));
      console.log(progressBar((demoSnapshot.marketCapUsd / evalDemo.nextMilestone.thresholdUsd) * 100) + " (demo)");
    }
    console.log();
    printRoadmap(evalDemo);
    return;
  }

  const [token, liquidity] = await Promise.all([readTokenInfo(), readLiquidity()]);

  let marketCap: number | null = null;
  if (token.totalSupply && liquidity.priceInPair !== null && liquidity.liquidityUsd !== null && liquidity.liquidityPairAsset) {
    const usdPerPairAsset = liquidity.liquidityUsd / liquidity.liquidityPairAsset;
    const totalSupplyNum = Number(token.totalSupply) / 10 ** token.decimals;
    marketCap = totalSupplyNum * liquidity.priceInPair * usdPerPairAsset;
  }

  const evaluation = evaluateRoadmap(marketCap);

  console.log(label("CURRENT MCAP", fmtUsd(marketCap)));
  console.log(
    label("CURRENT PHASE", `${evaluation.currentPhase.id} — ${evaluation.currentPhase.name} (${statusTag(evaluation.currentPhase.status)})`)
  );
  if (!evaluation.currentPhase.verifiedOnChain && evaluation.currentPhase.thresholdUsd === null) {
    console.log(dim("  status as declared by the project — no on-chain number to check this phase against"));
  }

  console.log();
  if (evaluation.nextMilestone) {
    console.log(dim(`PROGRESS TO $${evaluation.nextMilestone.thresholdUsd.toLocaleString("en-US")} (PHASE ${evaluation.nextMilestone.phase.id}: ${evaluation.nextMilestone.phase.name})`));
    if (marketCap === null) {
      console.log(DATA_UNAVAILABLE + " — needs a live pool, total supply, and a USD price feed");
    } else {
      console.log(progressBar((marketCap / evaluation.nextMilestone.thresholdUsd) * 100));
      const remaining = evaluation.nextMilestone.thresholdUsd - marketCap;
      console.log();
      console.log(label("REMAINING", remaining > 0 ? fmtUsd(remaining) : "milestone reached"));
    }
  } else {
    console.log(dim("PHASE 5 ($2M) already reached — no further numeric milestone in the roadmap. PHASE 6 has no defined target."));
  }

  console.log();
  printRoadmap(evaluation);
}

function printRoadmap(evaluation: ReturnType<typeof evaluateRoadmap>) {
  console.log(dim("ROADMAP"));
  for (const phase of evaluation.phases) {
    const mark = phase.status === "done" ? "[x]" : phase.status === "running" ? "[~]" : "[ ]";
    const target = phase.thresholdUsd !== null ? `$${phase.thresholdUsd.toLocaleString("en-US")} MCAP` : statusTag(phase.status);
    const verified = phase.thresholdUsd !== null ? "" : dim(phase.id === 6 ? "" : " (declared)");
    console.log(`${mark} PHASE ${phase.id}  ${phase.name.padEnd(24)} ${target}${verified}`);
  }
}
