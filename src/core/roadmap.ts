/**
 * The actual $GTTM roadmap copy from groktothemoon.foundation. This is
 * project lore, not fetched data — same category as NEXT_MILESTONE_USD used
 * to be. The two numeric milestones ($1M, $2M) are the only parts anyone
 * can check against a real number; everything else here is the project's
 * own claim about itself, and is labeled as such rather than presented as
 * chain-verified.
 */
export interface RoadmapPhase {
  id: number;
  name: string;
  blurb: string;
  thresholdUsd: number | null;
  /** What the site itself claims, for phases with no on-chain threshold to check. */
  declaredStatus: "done" | "running" | "pending";
}

export const ROADMAP: RoadmapPhase[] = [
  {
    id: 1,
    name: "LIFT OFF",
    blurb: "Launched on Robinhood Chain through PONS, LP burned, ownership renounced, chart pushed onto every screener.",
    thresholdUsd: null,
    declaredStatus: "done",
  },
  {
    id: 2,
    name: "MAKE NOISE",
    blurb: "Memes, spaces and raids run by the community, not rented influencers.",
    thresholdUsd: null,
    declaredStatus: "running",
  },
  {
    id: 3,
    name: "EVERY FEE GOES BACK IN",
    blurb: "Creator fees spent buying $GTTM back off the open market, from a public wallet.",
    thresholdUsd: null,
    declaredStatus: "running",
  },
  {
    id: 4,
    name: "THE EXCHANGE CALLS",
    blurb: "Conversations with tier-three desks (BingX, MEXC, Gate) turn into actual terms.",
    thresholdUsd: 1_000_000,
    declaredStatus: "pending",
  },
  {
    id: 5,
    name: "GET LISTED",
    blurb: "Take the best terms and get listed somewhere anyone can buy in two taps.",
    thresholdUsd: 2_000_000,
    declaredStatus: "pending",
  },
  {
    id: 6,
    name: "YOU KNOW THIS PART",
    blurb: "Then we go find a bigger moon.",
    thresholdUsd: null,
    declaredStatus: "pending",
  },
];

export type PhaseStatus = "done" | "running" | "pending";

export interface EvaluatedPhase extends RoadmapPhase {
  status: PhaseStatus;
  /** True only for phase 4/5: this status came from a real marketCap comparison, not the site's own claim. */
  verifiedOnChain: boolean;
}

export interface RoadmapEvaluation {
  phases: EvaluatedPhase[];
  currentPhase: EvaluatedPhase;
  /** The next numeric milestone not yet reached, or null if $2M is already passed (or marketCap is unknown). */
  nextMilestone: { thresholdUsd: number; phase: EvaluatedPhase } | null;
}

/**
 * Phases 1-3 and 6 have no on-chain number to check, so their status is the
 * project's own declared claim (labeled `verifiedOnChain: false`). Phases 4
 * and 5 are computed from a real market cap figure when one is available —
 * with no market cap, they're left `pending` rather than guessed, and the
 * whole evaluation is marked accordingly by the caller.
 */
export function evaluateRoadmap(marketCapUsd: number | null): RoadmapEvaluation {
  const phases: EvaluatedPhase[] = ROADMAP.map((phase) => {
    if (phase.thresholdUsd === null) {
      // Phase 6 only starts once phase 5's threshold is actually met.
      if (phase.id === 6) {
        const reached = marketCapUsd !== null && marketCapUsd >= 2_000_000;
        return { ...phase, status: reached ? "running" : "pending", verifiedOnChain: reached };
      }
      return { ...phase, status: phase.declaredStatus, verifiedOnChain: false };
    }
    const reached = marketCapUsd !== null && marketCapUsd >= phase.thresholdUsd;
    return { ...phase, status: reached ? "done" : "pending", verifiedOnChain: marketCapUsd !== null };
  });

  const currentPhase = [...phases].reverse().find((p) => p.status !== "pending") ?? phases[0];
  const nextMilestonePhase = phases.find((p) => p.thresholdUsd !== null && p.status === "pending");

  return {
    phases,
    currentPhase,
    nextMilestone: nextMilestonePhase ? { thresholdUsd: nextMilestonePhase.thresholdUsd!, phase: nextMilestonePhase } : null,
  };
}
