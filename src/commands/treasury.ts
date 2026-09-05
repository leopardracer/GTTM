import { config } from "../core/config.js";
import { readBuybackStats } from "../chain/transactions.js";
import { fmtToken } from "../core/format.js";
import { header, label, dim, demoBanner } from "../ui/terminal.js";

export async function runTreasury() {
  console.log(header("ABACUS"));
  console.log();

  if (config.isDemo()) {
    console.log(demoBanner());
    return;
  }

  const buyback = await readBuybackStats();

  console.log(dim("TREASURY"));
  console.log();
  if (!buyback.configured) {
    console.log("BUYBACK_WALLET not configured in .env — nothing to report.");
    console.log(dim("set it to track the Phase 3 buyback wallet on-chain."));
    return;
  }

  console.log(label("BUYBACK TXNS", String(buyback.count)));
  console.log(label("BUYBACK TOTAL", fmtToken(buyback.total)));
  console.log();
  console.log(dim("ACTIVITY"));
  if (buyback.transfers.length === 0) {
    console.log("no buyback transfers in the scanned window");
  } else {
    for (const t of buyback.transfers.slice(0, 10)) {
      console.log(`  +${t.amount.toFixed(2)} $GTTM  block #${t.blockNumber}  ${t.txHash}`);
    }
  }
  console.log();
  console.log(label("ABACUS VERDICT", buyback.count > 0 ? "HEALTHY" : "QUIET"));
}
