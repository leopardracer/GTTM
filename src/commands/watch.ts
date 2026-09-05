import { formatUnits } from "viem";
import { config } from "../core/config.js";
import { getClient } from "../chain/client.js";
import { erc20Abi } from "../chain/token.js";
import { genericPoolAbi } from "../chain/liquidity.js";
import { header, dim, demoBanner } from "../ui/terminal.js";
import { demoSnapshot } from "../core/demo.js";

function timeNow(): string {
  return new Date().toTimeString().slice(0, 8);
}

async function runDemoWatch() {
  console.log(header("GTTM WATCH"));
  console.log(demoBanner());
  console.log();
  for (const ev of demoSnapshot.recentEvents) {
    console.log(`${ev.time}  ${ev.type.padEnd(10)} ${ev.detail}`);
  }
  console.log();
  console.log(dim("demo mode doesn't poll — configure GTTM_CONTRACT_ADDRESS for a live feed."));
}

export async function runWatch() {
  if (config.isDemo()) {
    await runDemoWatch();
    return;
  }

  console.log(header("GTTM WATCH"));
  console.log();

  const client = getClient();
  const token = config.requireTokenAddress();
  const pool = config.poolAddress;
  const decimals = config.tokenDecimals;

  let lastBlock = await client.getBlockNumber();
  console.log(dim(`watching from block #${lastBlock}. Ctrl+C to exit.`));

  let stopped = false;
  process.on("SIGINT", () => {
    stopped = true;
    console.log("\n" + dim("stopped."));
    process.exit(0);
  });

  while (!stopped) {
    await new Promise((r) => setTimeout(r, config.watchPollMs));

    let latest: bigint;
    try {
      latest = await client.getBlockNumber();
    } catch (e: any) {
      console.log(`${timeNow()}  ${dim("RPC error, retrying: " + (e?.shortMessage ?? e?.message))}`);
      continue;
    }
    if (latest <= lastBlock) continue;

    const fromBlock = lastBlock + 1n;

    try {
      const transferLogs = await client.getLogs({
        address: token,
        event: erc20Abi[0],
        fromBlock,
        toBlock: latest,
      });
      for (const log of transferLogs) {
        const { value } = log.args as { value: bigint };
        console.log(`${timeNow()}  ${"TRANSFER".padEnd(10)} ${Number(formatUnits(value, decimals)).toFixed(2)} $GTTM`);
      }

      if (pool) {
        const swapLogs = await client.getLogs({
          address: pool,
          event: genericPoolAbi[3],
          fromBlock,
          toBlock: latest,
        });
        for (const log of swapLogs) {
          console.log(`${timeNow()}  ${"SWAP".padEnd(10)} block #${log.blockNumber}`);
        }
      }
    } catch (e: any) {
      console.log(`${timeNow()}  ${dim("log fetch error: " + (e?.shortMessage ?? e?.message))}`);
    }

    lastBlock = latest;
  }
}
