import { config } from "../core/config.js";
import { pingChain } from "../chain/client.js";

export const meta = { name: "WRENCH", role: "technical operations" };

export async function readout(): Promise<string[]> {
  if (config.isDemo()) {
    return ["demo mode — nothing to check. run `gttm doctor` after configuring .env"];
  }

  const ping = await pingChain();
  if (ping.ok) {
    return [`RPC reachable, latest block #${ping.blockNumber}`, "run `gttm doctor` for the full diagnostic"];
  }
  return [`RPC unreachable: ${ping.reason}`, "run `gttm doctor` for the full diagnostic"];
}
