import { formatUnits } from "viem";
import { getClient } from "./client.js";
import { config } from "../core/config.js";
import { getPairAssetUsdPrice } from "../core/price-feed.js";

export const genericPoolAbi = [
  {
    type: "function",
    name: "getReserves",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "reserve0", type: "uint112" },
      { name: "reserve1", type: "uint112" },
      { name: "blockTimestampLast", type: "uint32" },
    ],
  },
  {
    type: "function",
    name: "token0",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "token1",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "event",
    name: "Swap",
    inputs: [
      { name: "sender", type: "address", indexed: true },
      { name: "amount0In", type: "uint256", indexed: false },
      { name: "amount1In", type: "uint256", indexed: false },
      { name: "amount0Out", type: "uint256", indexed: false },
      { name: "amount1Out", type: "uint256", indexed: false },
      { name: "to", type: "address", indexed: true },
    ],
  },
] as const;

export interface LiquidityInfo {
  hasPool: boolean;
  poolAddress?: `0x${string}`;
  tokenReserve: number | null;
  pairReserve: number | null;
  priceInPair: number | null;
  liquidityPairAsset: number | null; // 2x pairReserve, the standard TVL convention
  liquidityUsd: number | null;
  usdUnavailableReason?: string;
}

/**
 * Note on pons v2 pre-graduation: a token still on the bonding curve has no
 * pool matching this ABI, so this correctly reports hasPool: false rather
 * than guessing. Curve-based pricing is a documented gap — see
 * src/chain/pons-gap.ts.
 */
export async function readLiquidity(): Promise<LiquidityInfo> {
  const pool = config.poolAddress;
  if (!pool) {
    return {
      hasPool: false,
      tokenReserve: null,
      pairReserve: null,
      priceInPair: null,
      liquidityPairAsset: null,
      liquidityUsd: null,
      usdUnavailableReason: "no POOL_ADDRESS configured",
    };
  }

  const client = getClient();
  const tokenAddress = config.requireTokenAddress();

  const [reserves, token0] = await Promise.all([
    client.readContract({ address: pool, abi: genericPoolAbi, functionName: "getReserves" }),
    client.readContract({ address: pool, abi: genericPoolAbi, functionName: "token0" }),
  ]);

  const [reserve0, reserve1] = reserves as [bigint, bigint, number];
  const tokenIsToken0 = (token0 as string).toLowerCase() === tokenAddress.toLowerCase();

  const tokenReserveRaw = tokenIsToken0 ? reserve0 : reserve1;
  const pairReserveRaw = tokenIsToken0 ? reserve1 : reserve0;

  const tokenReserve = Number(formatUnits(tokenReserveRaw, config.tokenDecimals));
  const pairReserve = Number(formatUnits(pairReserveRaw, 18));
  const priceInPair = tokenReserve > 0 ? pairReserve / tokenReserve : null;
  const liquidityPairAsset = pairReserve * 2;

  const usdPrice = await getPairAssetUsdPrice();
  const liquidityUsd = usdPrice !== null ? liquidityPairAsset * usdPrice : null;

  return {
    hasPool: true,
    poolAddress: pool,
    tokenReserve,
    pairReserve,
    priceInPair,
    liquidityPairAsset,
    liquidityUsd,
    usdUnavailableReason: usdPrice === null ? "USD price feed unavailable" : undefined,
  };
}
