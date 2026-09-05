import { config } from "../core/config.js";
import { readTokenInfo } from "../chain/token.js";
import { readLiquidity } from "../chain/liquidity.js";
import { readHolderStats } from "../chain/holders.js";
import { readActivityStats } from "../chain/transactions.js";
import { fmtToken, fmtNum, DATA_UNAVAILABLE } from "../core/format.js";
import { header, label, dim } from "../ui/terminal.js";
import { demoBanner } from "../ui/terminal.js";

export async function runScan() {
  console.log(header("GTTM SCAN"));
  console.log();

  if (config.isDemo()) {
    console.log(demoBanner());
    return;
  }

  const [token, liquidity, holders, activity] = await Promise.all([
    readTokenInfo(),
    readLiquidity(),
    readHolderStats(20, 20), // wider window for a scan
    readActivityStats(),
  ]);

  console.log(label("CONTRACT", token.address));
  console.log(label("EXISTS", token.contractExists ? "yes" : "no bytecode at this address"));
  console.log(label("SYMBOL", token.symbol ?? DATA_UNAVAILABLE));
  console.log(label("SUPPLY", token.totalSupply !== null ? fmtNum(Number(token.totalSupply) / 10 ** token.decimals) : DATA_UNAVAILABLE));
  console.log(
    label(
      "DEPLOYER",
      "not available in v0.1 " + dim("(needs an indexer or archive-node trace of the creation tx)")
    )
  );
  console.log();
  console.log(label("LIQUIDITY", liquidity.hasPool ? fmtToken(liquidity.liquidityPairAsset, "ETH") : DATA_UNAVAILABLE));
  console.log(label("HOLDERS*", fmtNum(holders.activeAddressesInWindow)));
  console.log(label("24H ACTIVITY", `${activity.buyCount} buys / ${activity.sellCount} sells`));
  console.log();

  console.log(dim("TOP NET ACCUMULATORS IN WINDOW*"));
  for (const h of holders.topAccumulators.slice(0, 5)) {
    console.log(`  ${h.address}  ${h.netChange >= 0 ? "+" : ""}${h.netChange.toFixed(2)}`);
  }
  console.log(dim("  * concentration here is net change within the scanned window, not"));
  console.log(dim("    lifetime balance — a real concentration % needs full transfer history"));

  console.log();
  console.log(dim("WHALE MOVES (>= 1,000,000 tokens in one transfer)"));
  if (holders.whaleMoves.length === 0) {
    console.log("  none in this window");
  } else {
    for (const m of holders.whaleMoves.slice(0, 5)) {
      console.log(`  ${m.amount.toFixed(2)}  ${m.from} -> ${m.to}  block #${m.blockNumber}`);
    }
  }
}
