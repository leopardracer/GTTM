import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreLaunch } from "./huntScore.js";
import type { DetectedLaunch } from "../chain/hunt.js";

function launch(overrides: Partial<DetectedLaunch> = {}): DetectedLaunch {
  return {
    token: "0x0000000000000000000000000000000000000001",
    curve: "0x0000000000000000000000000000000000000002",
    deployer: "0x0000000000000000000000000000000000000003",
    pairToken: "0x0000000000000000000000000000000000000000",
    graduationThreshold: 4_200_000_000_000_000_000n,
    launchBlock: 1n,
    launchTxHash: "0x0000000000000000000000000000000000000000000000000000000000000001",
    launchTimestamp: null,
    devBuyTokens: 2_857_142, // 0.4% of 714,285,714
    devBuyTaxBps: 9900,
    exemptWalletCount: 0,
    deployerLaunchCountInWindow: 1,
    ...overrides,
  };
}

test("a clean launch (small dev buy, no exemptions, first launch) scores FIRE", () => {
  const result = scoreLaunch(launch());
  assert.equal(result.verdict, "FIRE");
  assert.equal(result.score, 100);
});

test("a large dev buy lowers the score and adds a reason", () => {
  const result = scoreLaunch(launch({ devBuyTokens: 50_000_000 })); // ~7%
  assert.ok(result.score < 100);
  assert.ok(result.reasons.some((r) => r.includes("large dev buy")));
});

test("declared exempt wallets (bundle) are flagged", () => {
  const result = scoreLaunch(launch({ exemptWalletCount: 4 }));
  assert.ok(result.reasons.some((r) => r.includes("declared bundle")));
  assert.notEqual(result.verdict, "FIRE");
});

test("a serial deployer is flagged", () => {
  const result = scoreLaunch(launch({ deployerLaunchCountInWindow: 6 }));
  assert.ok(result.reasons.some((r) => r.includes("serial deployer")));
});

test("multiple red flags compound into a PASS verdict", () => {
  const result = scoreLaunch(
    launch({ devBuyTokens: 50_000_000, exemptWalletCount: 4, deployerLaunchCountInWindow: 6 })
  );
  assert.equal(result.verdict, "PASS");
  assert.ok(result.score < 50);
});

test("no dev buy in the launch tx is reported plainly, not penalized as a red flag", () => {
  const result = scoreLaunch(launch({ devBuyTokens: null, devBuyTaxBps: null }));
  assert.ok(result.reasons.some((r) => r === "no dev buy in the launch transaction"));
  assert.equal(result.verdict, "FIRE");
});

test("a dev buy taxed below the opening snipe rate is flagged as possible self-exemption", () => {
  const result = scoreLaunch(launch({ devBuyTaxBps: 100 }));
  assert.ok(result.reasons.some((r) => r.includes("self-exempted")));
});
