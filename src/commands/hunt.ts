import { config } from "../core/config.js";
import { scanRecentLaunches, devBuyPercentOfCurveSupply } from "../chain/hunt.js";
import { scoreLaunch } from "../core/huntScore.js";
import { header, dim, demoBanner, verdictColor } from "../ui/terminal.js";
import { demoLaunches } from "../core/demo.js";

export async function runHunt() {
  console.log(header("GTTM HUNT — ROBINHOOD CHAIN"));
  console.log();

  if (!config.rpcUrl) {
    console.log(demoBanner());
    console.log(dim("(hunt only needs RPC_URL, not GTTM_CONTRACT_ADDRESS — it scans the whole chain)"));
    console.log();
    for (const l of demoLaunches) {
      printDemoCard(l);
    }
    return;
  }

  console.log(dim(`scanning last ${config.signalWindowBlocks} blocks on the Pons V2 factory...`));
  console.log();

  const launches = await scanRecentLaunches();

  if (launches.length === 0) {
    console.log("no launches found in this window.");
    return;
  }

  for (const launch of launches) {
    const score = scoreLaunch(launch);
    const devBuyPct = devBuyPercentOfCurveSupply(launch.devBuyTokens);

    console.log(dim("─".repeat(42)));
    console.log(`TOKEN       ${launch.token}`);
    console.log(`DEPLOYER    ${launch.deployer}`);
    console.log(`BLOCK       #${launch.launchBlock}`);
    console.log(`DEV BUY     ${devBuyPct !== null ? devBuyPct.toFixed(2) + "%" : "none"}`);
    console.log(`EXEMPT      ${launch.exemptWalletCount} wallet(s)`);
    console.log(`DEPLOYER    ${launch.deployerLaunchCountInWindow} launch(es) in window`);
    console.log();
    for (const r of score.reasons) console.log(`  * ${r}`);
    console.log();
    console.log(`VERDICT     ${verdictColor(score.verdict === "FIRE" ? "BULLISH" : score.verdict === "PASS" ? "BEARISH" : "WATCH")} (${score.verdict})`);
    console.log(`SCORE       ${score.score} / 100`);
    console.log();
  }
}

function printDemoCard(l: (typeof demoLaunches)[number]) {
  console.log(dim("─".repeat(42)));
  console.log(`TOKEN       ${l.token} (demo)`);
  console.log(`DEPLOYER    ${l.deployer} (demo)`);
  console.log(`BLOCK       #${l.launchBlock} (demo)`);
  console.log(`DEV BUY     ${l.devBuyPct.toFixed(2)}%`);
  console.log(`EXEMPT      ${l.exemptWalletCount} wallet(s)`);
  console.log(`DEPLOYER    ${l.deployerLaunchCount} launch(es) in window`);
  console.log();
  for (const r of l.reasons) console.log(`  * ${r}`);
  console.log();
  console.log(`VERDICT     ${l.verdict}`);
  console.log(`SCORE       ${l.score} / 100`);
  console.log();
}
