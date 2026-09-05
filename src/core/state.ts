import fs from "node:fs";
import path from "node:path";

const STATE_PATH = path.join(process.cwd(), ".gttm-state.json");

export interface Snapshot {
  timestamp: number;
  liquidityPair: number | null;
  activeHolders: number | null;
  buybackTotal: number | null;
}

export function readLastSnapshot(): Snapshot | null {
  try {
    const raw = fs.readFileSync(STATE_PATH, "utf-8");
    return JSON.parse(raw) as Snapshot;
  } catch {
    return null;
  }
}

export function writeSnapshot(snap: Snapshot): void {
  try {
    fs.writeFileSync(STATE_PATH, JSON.stringify(snap, null, 2));
  } catch {
    // best-effort only — trend detection just degrades to "no history" next run
  }
}

/**
 * Compares to the last saved snapshot. Returns null (not a guess) when
 * there's nothing to compare against yet — first run, or the value wasn't
 * available then either.
 */
export function trend(current: number | null, previous: number | null | undefined): "up" | "down" | "flat" | null {
  if (current === null || previous === null || previous === undefined) return null;
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}
