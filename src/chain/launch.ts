import { formatUnits } from "viem";
import { getClient } from "./client.js";
import { config } from "../core/config.js";
import {
  PONS_V2_FACTORY,
  NATIVE_ETH,
  factoryAbi,
  curveAbi,
} from "./pons.js";

export interface LaunchRecord {
  found: true;
  curve: `0x${string}`;
  deployer: `0x${string}`;
  pairToken: `0x${string}`;
  launchConfigId: bigint;
  graduationThreshold: bigint;
  launchBlock: bigint;
  launchTxHash: `0x${string}`;
}

export interface NoLaunchRecord {
  found: false;
  reason: string;
}

/**
 * Looks up the token's TokenLaunched event on the Pons V2 factory. This is
 * the real source for "who deployed it" — no trace/indexer needed, because
 * the factory names the deployer as an indexed argument on every launch.
 *
 * Scans from block 0 by default, which is fine for a young launch (the
 * expected case for a token that JUST launched) but can be slow on an old
 * token with a distant launch block on a rate-limited public RPC — pass
 * `sinceBlock` if you already know roughly when it launched.
 */
export async function readLaunchRecord(
  tokenAddress: `0x${string}`,
  sinceBlock: bigint = 0n
): Promise<LaunchRecord | NoLaunchRecord> {
  const client = getClient();
  const latest = await client.getBlockNumber();

  const logs = await client.getLogs({
    address: PONS_V2_FACTORY,
    event: factoryAbi[0], // TokenLaunched
    args: { token: tokenAddress },
    fromBlock: sinceBlock,
    toBlock: latest,
  });

  if (logs.length === 0) {
    return {
      found: false,
      reason:
        "no TokenLaunched event found for this address on the Pons V2 factory " +
        "(could be a non-Pons token, a Pons V1 launch, or launched before `sinceBlock`)",
    };
  }

  const log = logs[0];
  const args = log.args as {
    curve: `0x${string}`;
    deployer: `0x${string}`;
    pairToken: `0x${string}`;
    launchConfigId: bigint;
    graduationThreshold: bigint;
  };

  return {
    found: true,
    curve: args.curve,
    deployer: args.deployer,
    pairToken: args.pairToken,
    launchConfigId: args.launchConfigId,
    graduationThreshold: args.graduationThreshold,
    launchBlock: log.blockNumber!,
    launchTxHash: log.transactionHash!,
  };
}

export interface CurveState {
  hasCurve: true;
  curveAddress: `0x${string}`;
  graduated: boolean;
  netQuoteIn: number; // sum(quoteIn) - sum(quoteOut), in the pair asset's own decimals-adjusted units
  graduationThreshold: number;
  progressPercent: number;
  buyCount: number;
  sellCount: number;
  buyVolumePairAsset: number;
  sellVolumePairAsset: number;
  lastPriceInPair: number | null; // last trade's implied price, tokens priced in the pair asset
  devBuyTokens: number | null; // tokensOut on the very first CurveBuy in the launch tx, if any
}

/**
 * Reads real bonding-curve activity for a token that hasn't graduated yet.
 * Graduation progress is net quote taken in vs. the launch's own
 * graduationThreshold — there's no on-chain progress event, so this is the
 * documented way to derive it (sum CurveBuy.quoteIn minus CurveSell.quoteOut).
 */
export async function readCurveState(launch: LaunchRecord): Promise<CurveState> {
  const client = getClient();
  const latest = await client.getBlockNumber();

  const [buyLogs, sellLogs, completedLogs] = await Promise.all([
    client.getLogs({ address: launch.curve, event: curveAbi[0], fromBlock: launch.launchBlock, toBlock: latest }),
    client.getLogs({ address: launch.curve, event: curveAbi[1], fromBlock: launch.launchBlock, toBlock: latest }),
    client.getLogs({ address: launch.curve, event: curveAbi[2], fromBlock: launch.launchBlock, toBlock: latest }),
  ]);

  const pairDecimals = launch.pairToken.toLowerCase() === NATIVE_ETH ? 18 : 18; // most pair assets on the approved list are 18; see README caveat for the few that aren't
  const graduationThreshold = Number(formatUnits(launch.graduationThreshold, pairDecimals));

  let quoteIn = 0n;
  for (const log of buyLogs) quoteIn += (log.args as any).quoteIn as bigint;
  let quoteOut = 0n;
  for (const log of sellLogs) quoteOut += (log.args as any).quoteOut as bigint;

  const netQuoteInRaw = quoteIn - quoteOut;
  const netQuoteIn = Number(formatUnits(netQuoteInRaw < 0n ? 0n : netQuoteInRaw, pairDecimals));

  const allTrades = [...buyLogs.map((l) => ({ ...l, side: "buy" as const })), ...sellLogs.map((l) => ({ ...l, side: "sell" as const }))].sort(
    (a, b) => Number(a.blockNumber! - b.blockNumber!)
  );

  const lastTrade = allTrades[allTrades.length - 1];
  let lastPriceInPair: number | null = null;
  if (lastTrade) {
    const a = lastTrade.args as any;
    if (lastTrade.side === "buy") {
      lastPriceInPair = Number(formatUnits(a.quoteIn, pairDecimals)) / Number(formatUnits(a.tokensOut, config.tokenDecimals));
    } else {
      lastPriceInPair = Number(formatUnits(a.quoteOut, pairDecimals)) / Number(formatUnits(a.tokensIn, config.tokenDecimals));
    }
  }

  const firstBuyInLaunchTx = buyLogs.find((l) => l.transactionHash === launch.launchTxHash);
  const devBuyTokens = firstBuyInLaunchTx
    ? Number(formatUnits((firstBuyInLaunchTx.args as any).tokensOut as bigint, config.tokenDecimals))
    : null;

  return {
    hasCurve: true,
    curveAddress: launch.curve,
    graduated: completedLogs.length > 0,
    netQuoteIn,
    graduationThreshold,
    progressPercent: graduationThreshold > 0 ? Math.min(100, (netQuoteIn / graduationThreshold) * 100) : 0,
    buyCount: buyLogs.length,
    sellCount: sellLogs.length,
    buyVolumePairAsset: Number(formatUnits(quoteIn, pairDecimals)),
    sellVolumePairAsset: Number(formatUnits(quoteOut, pairDecimals)),
    lastPriceInPair,
    devBuyTokens,
  };
}
