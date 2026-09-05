/**
 * Demo mode data. Used only when GTTM_CONTRACT_ADDRESS is unset. Every
 * command that touches this must print a DEMO MODE banner — see
 * ui/terminal.ts#demoBanner. Numbers here are round and clearly fake on
 * purpose (nobody's liquidity is exactly $42,000).
 */
export const demoSnapshot = {
  symbol: "$GTTM",
  marketCapUsd: 42_000,
  liquidityUsd: 12_000,
  liquidityPair: 4.2,
  holders: 137,
  volume24hUsd: 3_100,
  buyback24hUsd: 250,
  recentEvents: [
    { time: "19:42:01", type: "BUY", detail: "0.12 ETH" },
    { time: "19:42:03", type: "HOLDER", detail: "+1" },
    { time: "19:42:08", type: "BUY", detail: "0.07 ETH" },
    { time: "19:42:12", type: "LIQUIDITY", detail: "+4.2%" },
    { time: "19:42:19", type: "SELL", detail: "0.03 ETH" },
  ],
};

/** Demo feed for `gttm hunt` — obviously fake addresses, clearly labeled. */
export const demoLaunches = [
  {
    token: "0xDEMO0000000000000000000000000000000001",
    deployer: "0xDEMODEPLOYER00000000000000000000000001",
    launchBlock: "52,900,001",
    devBuyPct: 0.4,
    exemptWalletCount: 0,
    deployerLaunchCount: 1,
    score: 100,
    verdict: "FIRE" as const,
    reasons: ["small dev buy: 0.40% of curve-sold supply"],
  },
  {
    token: "0xDEMO0000000000000000000000000000000002",
    deployer: "0xDEMODEPLOYER00000000000000000000000002",
    launchBlock: "52,899,988",
    devBuyPct: 6.2,
    exemptWalletCount: 4,
    deployerLaunchCount: 7,
    score: 28,
    verdict: "PASS" as const,
    reasons: [
      "large dev buy: 6.20% of curve-sold supply",
      "4 wallet(s) declared exempt from opening tax (declared bundle)",
      "serial deployer: 7 launches from this address in the scanned window",
    ],
  },
  {
    token: "0xDEMO0000000000000000000000000000000003",
    deployer: "0xDEMODEPLOYER00000000000000000000000003",
    launchBlock: "52,899,955",
    devBuyPct: 1.8,
    exemptWalletCount: 0,
    deployerLaunchCount: 1,
    score: 82,
    verdict: "WATCH" as const,
    reasons: ["moderate dev buy: 1.80% of curve-sold supply"],
  },
];
