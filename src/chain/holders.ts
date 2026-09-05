import { formatUnits } from "viem";
import { getClient } from "./client.js";
import { erc20Abi } from "./token.js";
import { readLaunchRecord } from "./launch.js";
import { PONS_PROTOCOL_ADDRESSES } from "./pons.js";
import { config } from "../core/config.js";

export interface HolderStats {
  windowFromBlock: bigint;
  windowToBlock: bigint;
  /** True lifetime holder count when the launch block is known (scan starts
   *  there, not at an arbitrary recent window) — false only falls back to a
   *  block-window scan if the token isn't a Pons V2 launch we can find. */
  isLifetime: boolean;
  holderCount: number;
  topAccumulators: { address: string; netChange: number }[];
  whaleMoves: { from: string; to: string; amount: number; txHash: string; blockNumber: string }[];
}

const PROTOCOL_SET = new Set(PONS_PROTOCOL_ADDRESSES.map((a) => a.toLowerCase()));

export async function readHolderStats(whaleThresholdTokens = 1_000_000, top = 10): Promise<HolderStats> {
  const client = getClient();
  const token = config.requireTokenAddress();
  const decimals = config.tokenDecimals;
  const latest = await client.getBlockNumber();

  const launch = await readLaunchRecord(token);
  const isLifetime = launch.found;
  const fromBlock = launch.found
    ? launch.launchBlock
    : latest > config.signalWindowBlocks
    ? latest - config.signalWindowBlocks
    : 0n;

  const logs = await client.getLogs({
    address: token,
    event: erc20Abi[0], // Transfer
    fromBlock,
    toBlock: latest,
  });

  const balance = new Map<string, bigint>();
  const netChange = new Map<string, bigint>();
  const whaleMoves: HolderStats["whaleMoves"] = [];
  const threshold = BigInt(Math.floor(whaleThresholdTokens)) * 10n ** BigInt(decimals);

  for (const log of logs) {
    const { from, to, value } = log.args as { from: string; to: string; value: bigint };
    balance.set(from, (balance.get(from) ?? 0n) - value);
    balance.set(to, (balance.get(to) ?? 0n) + value);
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

  // A real holder count: positive balance, protocol contracts excluded
  // (curve/locker/hook/PoolManager custody supply but aren't "holders" in
  // any meaningful sense — see chain/pons.ts).
  let holderCount = 0;
  for (const [address, bal] of balance) {
    if (bal > 0n && !PROTOCOL_SET.has(address.toLowerCase())) holderCount++;
  }

  const topAccumulators = [...netChange.entries()]
    .filter(([address]) => !PROTOCOL_SET.has(address.toLowerCase()))
    .sort((a, b) => (b[1] > a[1] ? 1 : -1))
    .slice(0, top)
    .map(([address, change]) => ({ address, netChange: Number(formatUnits(change, decimals)) }));

  return {
    windowFromBlock: fromBlock,
    windowToBlock: latest,
    isLifetime,
    holderCount,
    topAccumulators,
    whaleMoves,
  };
}
