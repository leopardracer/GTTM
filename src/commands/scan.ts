import { config } from "../core/config.js";
import { readTokenInfo } from "../chain/token.js";
import { readLiquidity } from "../chain/liquidity.js";
import { readHolderStats } from "../chain/holders.js";
import { readActivityStats } from "../chain/transactions.js";
import { readLaunchRecord } from "../chain/launch.js";
import { fmtToken, fmtNum, DATA_UNAVAILABLE } from "../core/format.js";
import { header, label, dim, demoBanner } from "../ui/terminal.js";

export async function runScan() {
  console.log(header("GTTM SCAN"));
  console.log();

  if (config.isDemo()) {
    console.log(demoBanner());
    return;
  }

  const tokenAddress = config.requireTokenAddress();

  const [token, liquidity, holders, activity, launch] = await Promise.all([
    readTokenInfo(),
    readLiquidity(),
    readHolderStats(20, 20),
    readActivityStats(),
    readLaunchRecord(tokenAddress),
  ]);

  console.log(label("CONTRACT", token.address));
  console.log(label("EXISTS", token.contractExists ? "yes" : "no bytecode at this address"));
  console.log(label("SYMBOL", token.symbol ?? DATA_UNAVAILABLE));
  console.log(label("SUPPLY", token.totalSupply !== null ? fmtNum(Number(token.totalSupply) / 10 ** token.decimals) : DATA_UNAVAILABLE));

  if (launch.found) {
    console.log(label("DEPLOYER", launch.deployer));
    console.log(dim(`  from TokenLaunched on the Pons V2 factory, tx ${launch.launchTxHash}`));
    console.log(label("CURVE", launch.curve));
    console.log(label("PAIR ASSET", launch.pairToken === "0x0000000000000000000000000000000000000000" ? "ETH (native)" : launch.pairToken));
  } else {
    console.log(label("DEPLOYER", DATA_UNAVAILABLE));
    console.log(dim(`  ${launch.reason}`));
  }

  console.log();
  console.log(label("LIQUIDITY", liquidity.hasPool ? fmtToken(liquidity.liquidityPairAsset, "ETH") : DATA_UNAVAILABLE));
  if (liquidity.hasPool && !liquidity.graduated) {
    console.log(label("GRADUATION", `${liquidity.progressPercent?.toFixed(1)}%`));
  }
  console.log(label("HOLDERS", fmtNum(holders.holderCount) + (holders.isLifetime ? " (lifetime)" : " (windowed)")));
  console.log(label("ACTIVITY", `${activity.buyCount} buys / ${activity.sellCount} sells`));
  console.log();

  console.log(dim("TOP NET ACCUMULATORS" + (holders.isLifetime ? " (lifetime)" : " (window)")));
  for (const h of holders.topAccumulators.slice(0, 5)) {
    console.log(`  ${h.address}  ${h.netChange >= 0 ? "+" : ""}${h.netChange.toFixed(2)}`);
  }
  console.log(dim("  protocol addresses (curve/locker/hook/pool manager) are excluded from this list"));

  console.log();
  console.log(dim("WHALE MOVES (>= 1,000,000 tokens in one transfer)"));
  if (holders.whaleMoves.length === 0) {
    console.log("  none found");
  } else {
    for (const m of holders.whaleMoves.slice(0, 5)) {
      console.log(`  ${m.amount.toFixed(2)}  ${m.from} -> ${m.to}  block #${m.blockNumber}`);
    }
  }
}
