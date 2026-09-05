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
