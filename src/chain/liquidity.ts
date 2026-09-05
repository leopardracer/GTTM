import { formatUnits } from "viem";
import { getClient } from "./client.js";
import { config } from "../core/config.js";
import { getPairAssetUsdPrice } from "../core/price-feed.js";
import { readLaunchRecord, readCurveState, type LaunchRecord } from "./launch.js";
import { NATIVE_ETH } from "./pons.js";

export interface LiquidityInfo {
  hasPool: boolean;
  source: "curve" | "none";
  poolAddress?: `0x${string}`;
  tokenReserve: number | null;
  pairReserve: number | null;
  priceInPair: number | null;
  liquidityPairAsset: number | null;
  liquidityUsd: number | null;
  graduated?: boolean;
  progressPercent?: number;
  usdUnavailableReason?: string;
}

/**
 * Real pre-graduation pricing off the token's own Pons V2 bonding curve —
 * closes the gap that used to say DATA UNAVAILABLE. Post-graduation, a
 * graduated Pons token trades in a real Uniswap v4 pool, which (unlike v2)
 * has no per-pool contract with getReserves() — v4 pools live inside a
 * shared PoolManager singleton keyed by PoolId, and reading a live price out
 * of it needs either a StateView/quoter contract call or an indexer. That's
 * genuinely not implemented here yet (see README's "Known limitations") —
 * it's a different, harder problem than the curve was, not a shortcut we
 * skipped.
 */
export async function readLiquidity(): Promise<LiquidityInfo> {
  const tokenAddress = config.requireTokenAddress();

  const launch = await readLaunchRecord(tokenAddress);
  if (!launch.found) {
    return {
      hasPool: false,
      source: "none",
      tokenReserve: null,
      pairReserve: null,
      priceInPair: null,
      liquidityPairAsset: null,
      liquidityUsd: null,
      usdUnavailableReason: launch.reason,
    };
  }

  const curve = await readCurveState(launch);

  if (curve.graduated) {
    return {
      hasPool: false,
      source: "none",
      tokenReserve: null,
      pairReserve: null,
      priceInPair: curve.lastPriceInPair,
      liquidityPairAsset: null,
      liquidityUsd: null,
      graduated: true,
      progressPercent: 100,
      usdUnavailableReason:
        "token has graduated to a Uniswap v4 pool — reading v4 pool state needs a " +
        "StateView/quoter call this toolkit doesn't implement yet (see README)",
    };
  }

  // Still on the curve: the curve's own quote-asset balance IS the reserve
  // backing it — a direct balance read, not a derived estimate.
  let liquidityPairAsset: number | null = null;
  if (launch.pairToken.toLowerCase() === NATIVE_ETH) {
    const balance = await getClient().getBalance({ address: launch.curve });
    liquidityPairAsset = Number(formatUnits(balance, 18));
  }
  // ERC-20 quote assets (USDG, cbBTC, tokenized stocks) would need that
  // token's own balanceOf(curve) — not implemented for the non-ETH case yet,
  // so liquidityPairAsset stays null rather than assuming ETH decimals apply.

  const usdPrice = await getPairAssetUsdPrice();
  const liquidityUsd = liquidityPairAsset !== null && usdPrice !== null ? liquidityPairAsset * usdPrice : null;

  return {
    hasPool: true,
    source: "curve",
    poolAddress: launch.curve,
    tokenReserve: null,
    pairReserve: liquidityPairAsset,
    priceInPair: curve.lastPriceInPair,
    liquidityPairAsset,
    liquidityUsd,
    graduated: false,
    progressPercent: curve.progressPercent,
    usdUnavailableReason:
      liquidityPairAsset === null
        ? "pair asset is not native ETH — ERC-20 quote-asset balance reading isn't implemented yet"
        : usdPrice === null
        ? "USD price feed unavailable"
        : undefined,
  };
}

export async function readLaunchAndCurve(): Promise<{
  launch: LaunchRecord | null;
  curve: Awaited<ReturnType<typeof readCurveState>> | null;
}> {
  const tokenAddress = config.requireTokenAddress();
  const launch = await readLaunchRecord(tokenAddress);
  if (!launch.found) return { launch: null, curve: null };
  const curve = await readCurveState(launch);
  return { launch, curve };
}
