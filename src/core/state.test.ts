import { test } from "node:test";
import assert from "node:assert/strict";
import { trend } from "./state.js";

test("trend returns null with no previous value (first run)", () => {
  assert.equal(trend(100, null), null);
  assert.equal(trend(100, undefined), null);
});

test("trend returns null when current is null", () => {
  assert.equal(trend(null, 100), null);
});

test("trend detects up, down, and flat correctly", () => {
  assert.equal(trend(110, 100), "up");
  assert.equal(trend(90, 100), "down");
  assert.equal(trend(100, 100), "flat");
});
