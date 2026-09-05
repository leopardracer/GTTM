import { formatUnits } from "viem";
import { getClient } from "./client.js";
import { erc20Abi } from "./token.js";
import { readLaunchRecord, readCurveState } from "./launch.js";
import { config } from "../core/config.js";

export interface ActivityStats {
  hasPool: boolean;
  buyCount: number;
  sellCount: number;
  buyVolumePairAsset: number;
  sellVolumePairAsset: number;
  windowFromBlock: bigint;
  windowToBlock: bigint;
  unavailableReason?: string;
}

/**
 * Real buy/sell activity, sourced from the token's own Pons V2 bonding-curve
 * CurveBuy/CurveSell events. Only covers pre-graduation activity — see
 * chain/liquidity.ts for why post-graduation v4 pool activity isn't read
 * here yet (no per-pool Swap event to filter on; needs the PoolManager's
 * own event stream keyed by PoolId, which this toolkit doesn't decode yet).
 */
export async function readActivityStats(): Promise<ActivityStats> {
  const client = getClient();
  const latest = await client.getBlockNumber();
  const tokenAddress = config.requireTokenAddress();

  const launch = await readLaunchRecord(tokenAddress);
  if (!launch.found) {
    return {
      hasPool: false,
      buyCount: 0,
      sellCount: 0,
      buyVolumePairAsset: 0,
      sellVolumePairAsset: 0,
      windowFromBlock: 0n,
      windowToBlock: latest,
      unavailableReason: launch.reason,
    };
  }

  const curve = await readCurveState(launch);

  if (curve.graduated) {
    return {
      hasPool: false,
      buyCount: 0,
      sellCount: 0,
      buyVolumePairAsset: 0,
      sellVolumePairAsset: 0,
      windowFromBlock: launch.launchBlock,
      windowToBlock: latest,
      unavailableReason: "token has graduated — post-graduation v4 pool activity isn't read yet (see README)",
    };
  }

  return {
    hasPool: true,
    buyCount: curve.buyCount,
    sellCount: curve.sellCount,
    buyVolumePairAsset: curve.buyVolumePairAsset,
    sellVolumePairAsset: curve.sellVolumePairAsset,
    windowFromBlock: launch.launchBlock,
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
