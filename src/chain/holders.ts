import { formatUnits } from "viem";
import { getClient } from "./client.js";
import { erc20Abi } from "./token.js";
import { config } from "../core/config.js";

export interface HolderStats {
  windowFromBlock: bigint;
  windowToBlock: bigint;
  /** Unique addresses with a nonzero net balance change in this window —
   *  NOT a lifetime holder count, which would need full history. Labeled
   *  honestly as "active in window" everywhere it's displayed. */
  activeAddressesInWindow: number;
  topAccumulators: { address: string; netChange: number }[];
  whaleMoves: { from: string; to: string; amount: number; txHash: string; blockNumber: string }[];
}

export async function readHolderStats(whaleThresholdTokens = 1_000_000, top = 10): Promise<HolderStats> {
  const client = getClient();
  const token = config.requireTokenAddress();
  const decimals = config.tokenDecimals;

  const latest = await client.getBlockNumber();
  const windowBlocks = config.signalWindowBlocks;
  const fromBlock = latest > windowBlocks ? latest - windowBlocks : 0n;

  const logs = await client.getLogs({
    address: token,
    event: erc20Abi[0], // Transfer
    fromBlock,
    toBlock: latest,
  });

  const netChange = new Map<string, bigint>();
  const whaleMoves: HolderStats["whaleMoves"] = [];
  const threshold = BigInt(Math.floor(whaleThresholdTokens)) * 10n ** BigInt(decimals);

  for (const log of logs) {
    const { from, to, value } = log.args as { from: string; to: string; value: bigint };
    netChange.set(from, (netChange.get(from) ?? 0n) - value);
    netChange.set(to, (netChange.get(to) ?? 0n) + value);

    if (value >= threshold) {
      whaleMoves.push({
        from,
        to,
        amount: Number(formatUnits(value, decimals)),
        txHash: log.transactionHash!,
        blockNumber: log.blockNumber!.toString(),
      });
    }
  }

  const topAccumulators = [...netChange.entries()]
    .sort((a, b) => (b[1] > a[1] ? 1 : -1))
    .slice(0, top)
    .map(([address, change]) => ({ address, netChange: Number(formatUnits(change, decimals)) }));

  return {
    windowFromBlock: fromBlock,
    windowToBlock: latest,
    activeAddressesInWindow: netChange.size,
    topAccumulators,
    whaleMoves,
  };
}
