import { test } from "node:test";
import assert from "node:assert/strict";
import { computeSignals, type SignalInput } from "./signals.js";

const base: SignalInput = {
  liquidityPairAsset: null,
  holderCount: null,
  buyCount: 0,
  sellCount: 0,
  prevLiquidityPairAsset: undefined,
  prevHolderCount: undefined,
};

test("no data at all yields INSUFFICIENT DATA with zero confidence", () => {
  const result = computeSignals(base);
  assert.equal(result.verdict, "INSUFFICIENT DATA");
  assert.equal(result.confidence, 0);
  assert.deepEqual(result.rulesApplied, []);
});

test("buys clearly outnumbering sells is BULLISH", () => {
  const result = computeSignals({ ...base, buyCount: 10, sellCount: 0 });
  assert.equal(result.verdict, "BULLISH");
  assert.equal(result.confidence, 33);
  assert.equal(result.rulesApplied.length, 1);
});

test("sells clearly outnumbering buys is BEARISH", () => {
  const result = computeSignals({ ...base, buyCount: 0, sellCount: 10 });
  assert.equal(result.verdict, "BEARISH");
  assert.equal(result.confidence, 17);
});

test("roughly balanced buy/sell is WATCH", () => {
  const result = computeSignals({ ...base, buyCount: 5, sellCount: 5 });
  assert.equal(result.verdict, "WATCH");
  assert.equal(result.confidence, 25);
});

test("all three rules firing in the bullish direction gives max confidence", () => {
  const result = computeSignals({
    liquidityPairAsset: 12,
    holderCount: 110,
    buyCount: 10,
    sellCount: 0,
    prevLiquidityPairAsset: 10,
    prevHolderCount: 100,
  });
  assert.equal(result.verdict, "BULLISH");
  assert.equal(result.confidence, 100);
  assert.equal(result.rulesApplied.length, 3);
});

test("fewer firing rules means lower confidence even at the same ratio", () => {
  const oneRule = computeSignals({ ...base, buyCount: 10, sellCount: 0 });
  const threeRules = computeSignals({
    liquidityPairAsset: 12,
    holderCount: 110,
    buyCount: 10,
    sellCount: 0,
    prevLiquidityPairAsset: 10,
    prevHolderCount: 100,
  });
  assert.ok(oneRule.confidence < threeRules.confidence);
});

test("liquidity and holder trends only fire when a previous snapshot exists", () => {
  const result = computeSignals({ ...base, liquidityPairAsset: 12, holderCount: 110 });
  // prevLiquidityPairAsset/prevHolderCount are undefined -> trend() returns null -> rules don't fire
  assert.equal(result.verdict, "INSUFFICIENT DATA");
});
