import type { DetectedLaunch } from "../chain/hunt.js";
import { devBuyPercentOfCurveSupply } from "../chain/hunt.js";

export interface HuntScore {
  score: number; // 0-100, higher = more concerning (matches bodkin's convention: reasons are pass/fire style)
  verdict: "FIRE" | "WATCH" | "PASS";
  reasons: string[];
}

/**
 * v0.1 sniper scoring: a small set of explicit, readable rules — same
 * philosophy as core/signals.ts. Nothing here predicts price or claims
 * intelligence; it flags patterns worth a human's attention, with the
 * reason stated plainly. Thresholds are deliberately conservative and
 * meant to be tuned, not treated as ground truth.
 */
export function scoreLaunch(launch: DetectedLaunch): HuntScore {
  const reasons: string[] = [];
  let concern = 0; // higher = more red flags

  const devBuyPct = devBuyPercentOfCurveSupply(launch.devBuyTokens);
  if (devBuyPct !== null) {
    if (devBuyPct > 5) {
      reasons.push(`large dev buy: ${devBuyPct.toFixed(1)}% of curve-sold supply`);
      concern += 2;
    } else if (devBuyPct > 1) {
      reasons.push(`moderate dev buy: ${devBuyPct.toFixed(1)}% of curve-sold supply`);
      concern += 1;
    } else {
      reasons.push(`small dev buy: ${devBuyPct.toFixed(2)}% of curve-sold supply`);
    }
  } else {
    reasons.push("no dev buy in the launch transaction");
  }

  if (launch.exemptWalletCount > 0) {
    reasons.push(`${launch.exemptWalletCount} wallet(s) declared exempt from opening tax (declared bundle)`);
    concern += launch.exemptWalletCount >= 3 ? 2 : 1;
  }

  if (launch.deployerLaunchCountInWindow > 1) {
    reasons.push(`serial deployer: ${launch.deployerLaunchCountInWindow} launches from this address in the scanned window`);
    concern += launch.deployerLaunchCountInWindow >= 5 ? 2 : 1;
  }

  if (launch.devBuyTaxBps !== null && launch.devBuyTaxBps < 9900) {
    // The dev's own buy paid less than the opening snipe tax — only
    // possible if the dev wallet itself was in the exempt list.
    reasons.push(`dev buy paid a reduced tax (${(launch.devBuyTaxBps / 100).toFixed(1)}%) — dev may be self-exempted`);
    concern += 1;
  }

  // Higher concern -> lower score (0-100, where 100 is cleanest).
  const score = Math.max(0, 100 - concern * 18);
  const verdict: HuntScore["verdict"] = concern === 0 ? "FIRE" : concern <= 2 ? "WATCH" : "PASS";

  return { score, verdict, reasons };
}
