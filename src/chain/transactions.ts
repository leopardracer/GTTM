import { formatUnits } from "viem";
import { getClient } from "./client.js";
import { erc20Abi } from "./token.js";
import { genericPoolAbi } from "./liquidity.js";
import { config } from "../core/config.js";

export interface ActivityStats {
  hasPool: boolean;
  buyCount: number;
  sellCount: number;
  buyVolumePairAsset: number;
  sellVolumePairAsset: number;
  windowFromBlock: bigint;
  windowToBlock: bigint;
}

/**
 * Classifies pool Swap events as buy/sell relative to $GTTM: a swap where
 * the pair asset goes IN and $GTTM comes OUT is a buy, and vice versa.
 * Requires POOL_ADDRESS — pre-graduation curve trades aren't visible this
 * way (see chain/pons-gap.ts).
 */
export async function readActivityStats(): Promise<ActivityStats> {
  const pool = config.poolAddress;
  const latest = await getClient().getBlockNumber();
  const windowBlocks = config.signalWindowBlocks;
  const fromBlock = latest > windowBlocks ? latest - windowBlocks : 0n;

  if (!pool) {
    return {
      hasPool: false,
      buyCount: 0,
      sellCount: 0,
      buyVolumePairAsset: 0,
      sellVolumePairAsset: 0,
      windowFromBlock: fromBlock,
      windowToBlock: latest,
    };
  }

  const client = getClient();
  const tokenAddress = config.requireTokenAddress();
  const token0 = (await client.readContract({
    address: pool,
    abi: genericPoolAbi,
    functionName: "token0",
  })) as string;
  const tokenIsToken0 = token0.toLowerCase() === tokenAddress.toLowerCase();

  const logs = await client.getLogs({
    address: pool,
    event: genericPoolAbi[3], // Swap
    fromBlock,
    toBlock: latest,
  });

  let buyCount = 0;
  let sellCount = 0;
  let buyVolumePairAsset = 0;
  let sellVolumePairAsset = 0;

  for (const log of logs) {
    const { amount0In, amount1In, amount0Out, amount1Out } = log.args as {
      amount0In: bigint;
      amount1In: bigint;
      amount0Out: bigint;
      amount1Out: bigint;
    };

    const pairIn = tokenIsToken0 ? amount1In : amount0In;
    const pairOut = tokenIsToken0 ? amount1Out : amount0Out;
    const tokenOut = tokenIsToken0 ? amount0Out : amount1Out;
    const tokenIn = tokenIsToken0 ? amount0In : amount1In;

    if (pairIn > 0n && tokenOut > 0n) {
      buyCount++;
      buyVolumePairAsset += Number(formatUnits(pairIn, 18));
    } else if (tokenIn > 0n && pairOut > 0n) {
      sellCount++;
      sellVolumePairAsset += Number(formatUnits(pairOut, 18));
    }
  }

  return {
    hasPool: true,
    buyCount,
    sellCount,
    buyVolumePairAsset,
    sellVolumePairAsset,
    windowFromBlock: fromBlock,
    windowToBlock: latest,
  };
}

export interface BuybackStats {
  configured: boolean;
  total: number;
  count: number;
  transfers: { amount: number; txHash: string; blockNumber: string }[];
}

export async function readBuybackStats(): Promise<BuybackStats> {
  const wallet = config.buybackWallet;
  if (!wallet) return { configured: false, total: 0, count: 0, transfers: [] };

  const client = getClient();
  const token = config.requireTokenAddress();
  const decimals = config.tokenDecimals;
  const latest = await client.getBlockNumber();
  const windowBlocks = config.signalWindowBlocks;
  const fromBlock = latest > windowBlocks ? latest - windowBlocks : 0n;

  const logs = await client.getLogs({
    address: token,
    event: erc20Abi[0],
    args: { to: wallet },
    fromBlock,
    toBlock: latest,
  });

  const transfers = logs.map((log) => ({
    amount: Number(formatUnits((log.args as any).value as bigint, decimals)),
    txHash: log.transactionHash!,
    blockNumber: log.blockNumber!.toString(),
  }));

  return {
    configured: true,
    total: transfers.reduce((s, t) => s + t.amount, 0),
    count: transfers.length,
    transfers,
  };
}
