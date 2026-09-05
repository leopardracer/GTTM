import { test } from "node:test";
import assert from "node:assert/strict";
import { fmtUsd, fmtToken, fmtPercent, fmtNum, clamp, DATA_UNAVAILABLE } from "./format.js";

test("fmtUsd formats a normal number with a dollar sign", () => {
  assert.equal(fmtUsd(42000), "$42,000");
});

test("fmtUsd returns DATA_UNAVAILABLE for null, undefined, and NaN", () => {
  assert.equal(fmtUsd(null), DATA_UNAVAILABLE);
  assert.equal(fmtUsd(undefined), DATA_UNAVAILABLE);
  assert.equal(fmtUsd(NaN), DATA_UNAVAILABLE);
});

test("fmtToken appends the symbol and defaults to $GTTM", () => {
  assert.equal(fmtToken(4.2), "4.2 $GTTM");
  assert.equal(fmtToken(1.5, "ETH"), "1.5 ETH");
});

test("fmtToken returns DATA_UNAVAILABLE for missing values", () => {
  assert.equal(fmtToken(null), DATA_UNAVAILABLE);
  assert.equal(fmtToken(undefined), DATA_UNAVAILABLE);
});

test("fmtPercent formats with the requested precision", () => {
  assert.equal(fmtPercent(18.44), "18.4%");
  assert.equal(fmtPercent(18.44, 2), "18.44%");
});

test("fmtPercent returns DATA_UNAVAILABLE for missing values", () => {
  assert.equal(fmtPercent(null), DATA_UNAVAILABLE);
});

test("fmtNum adds thousands separators", () => {
  assert.equal(fmtNum(1000000), "1,000,000");
});

test("fmtNum returns DATA_UNAVAILABLE for missing values", () => {
  assert.equal(fmtNum(undefined), DATA_UNAVAILABLE);
});

test("clamp keeps a value inside [min, max]", () => {
  assert.equal(clamp(150, 0, 100), 100);
  assert.equal(clamp(-10, 0, 100), 0);
  assert.equal(clamp(50, 0, 100), 50);
});
