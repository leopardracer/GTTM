import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateRoadmap } from "./roadmap.js";

test("with no market cap, phase 3 is current and $1M is the next milestone", () => {
  const result = evaluateRoadmap(null);
  assert.equal(result.currentPhase.id, 3);
  assert.equal(result.currentPhase.status, "running");
  assert.equal(result.nextMilestone?.thresholdUsd, 1_000_000);
});

test("below $1M, phase 3 is still current", () => {
  const result = evaluateRoadmap(500_000);
  assert.equal(result.currentPhase.id, 3);
  assert.equal(result.nextMilestone?.thresholdUsd, 1_000_000);
});

test("between $1M and $2M, phase 4 is done and $2M is next", () => {
  const result = evaluateRoadmap(1_500_000);
  assert.equal(result.currentPhase.id, 4);
  assert.equal(result.currentPhase.status, "done");
  assert.equal(result.nextMilestone?.thresholdUsd, 2_000_000);
});

test("above $2M, phase 6 is running and there's no further milestone", () => {
  const result = evaluateRoadmap(2_500_000);
  assert.equal(result.currentPhase.id, 6);
  assert.equal(result.currentPhase.status, "running");
  assert.equal(result.nextMilestone, null);
});

test("phase 1 and 2 are always declared done/running regardless of market cap", () => {
  const result = evaluateRoadmap(0);
  const phase1 = result.phases.find((p) => p.id === 1)!;
  const phase2 = result.phases.find((p) => p.id === 2)!;
  assert.equal(phase1.status, "done");
  assert.equal(phase1.verifiedOnChain, false);
  assert.equal(phase2.status, "running");
  assert.equal(phase2.verifiedOnChain, false);
});

test("phase 4 and 5 status is marked verifiedOnChain only when a market cap is known", () => {
  const withData = evaluateRoadmap(1_500_000);
  const withoutData = evaluateRoadmap(null);
  assert.equal(withData.phases.find((p) => p.id === 4)!.verifiedOnChain, true);
  assert.equal(withoutData.phases.find((p) => p.id === 4)!.verifiedOnChain, false);
});
