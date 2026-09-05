import { trend } from "./state.js";

export interface SignalInput {
  liquidityPairAsset: number | null;
  holderCount: number | null;
  buyCount: number;
  sellCount: number;
  prevLiquidityPairAsset: number | null | undefined;
  prevHolderCount: number | null | undefined;
}

export interface SignalReport {
  bullets: string[];
  verdict: "BULLISH" | "WATCH" | "BEARISH" | "INSUFFICIENT DATA";
  confidence: number; // 0-100
  rulesApplied: string[];
}

/**
 * v0.1 "AI": a small set of clearly-stated, deterministic rules. No model,
 * no hidden weighting, nothing that pretends to be smarter than it is.
 * Confidence scales with how many of the rules actually had data to fire on
 * — fewer inputs means lower confidence, not a hidden default.
 */
export function computeSignals(input: SignalInput): SignalReport {
  const bullets: string[] = [];
  const rulesApplied: string[] = [];
  let score = 0;
  let maxScore = 0;

  // Rule 1: liquidity trend
  const liqTrend = trend(input.liquidityPairAsset, input.prevLiquidityPairAsset);
  if (liqTrend) {
    rulesApplied.push("liquidity trend vs. last run");
    maxScore += 1;
    if (liqTrend === "up") {
      bullets.push("liquidity increasing since last check");
      score += 1;
    } else if (liqTrend === "down") {
      bullets.push("liquidity decreasing since last check");
    } else {
      bullets.push("liquidity flat since last check");
      score += 0.5;
    }
  }

  // Rule 2: holder trend
  const holderTrend = trend(input.holderCount, input.prevHolderCount);
  if (holderTrend) {
    rulesApplied.push("holder count vs. last run");
    maxScore += 1;
    if (holderTrend === "up") {
      bullets.push("holder count increasing");
      score += 1;
    } else if (holderTrend === "down") {
      bullets.push("holder count decreasing");
    } else {
      bullets.push("holder count flat");
      score += 0.5;
    }
  }

  // Rule 3: buy/sell ratio in window
  const totalTx = input.buyCount + input.sellCount;
  if (totalTx > 0) {
    rulesApplied.push("buy/sell ratio in window");
    maxScore += 1;
    const buyRatio = input.buyCount / totalTx;
    if (buyRatio > 0.6) {
      bullets.push(`buys outnumber sells in window (${input.buyCount} vs ${input.sellCount})`);
      score += 1;
    } else if (buyRatio < 0.4) {
      bullets.push(`sells outnumber buys in window (${input.sellCount} vs ${input.buyCount})`);
    } else {
      bullets.push(`buy/sell roughly balanced (${input.buyCount} vs ${input.sellCount})`);
      score += 0.5;
    }
  }

  if (maxScore === 0) {
    return {
      bullets: ["not enough history or activity yet to produce a signal — run again after some chain activity"],
      verdict: "INSUFFICIENT DATA",
      confidence: 0,
      rulesApplied: [],
    };
  }

  const ratio = score / maxScore;
  const confidence = Math.round((maxScore / 3) * 100 * (0.5 + ratio / 2)); // more rules + better ratio = more confidence
  const verdict: SignalReport["verdict"] = ratio > 0.66 ? "BULLISH" : ratio > 0.33 ? "WATCH" : "BEARISH";

  return { bullets, verdict, confidence: Math.min(100, confidence), rulesApplied };
}
