import { config } from "../core/config.js";
import { pingChain } from "../chain/client.js";
import { readTokenInfo } from "../chain/token.js";
import { header, pass, fail, dim } from "../ui/terminal.js";

function nodeOk(): { ok: boolean; version: string } {
  const version = process.version;
  const major = Number(version.slice(1).split(".")[0]);
  return { ok: major >= 20, version };
}

export async function runDoctor() {
  console.log(header("GTTM DOCTOR"));
  console.log();

  const results: { name: string; ok: boolean; detail?: string }[] = [];

  const node = nodeOk();
  results.push({ name: "Node", ok: node.ok, detail: node.ok ? node.version : `${node.version} — need >=20` });

  const hasRpc = !!config.rpcUrl;
  results.push({
    name: "Configuration",
    ok: hasRpc || config.isDemo(),
    detail: config.isDemo() ? "demo mode (no GTTM_CONTRACT_ADDRESS)" : hasRpc ? "RPC_URL set" : "RPC_URL missing",
  });

  if (config.isDemo()) {
    for (const r of results) console.log(r.ok ? pass(r.name) : fail(r.name), r.detail ? dim(`  ${r.detail}`) : "");
    console.log();
    console.log(dim("running in demo mode — set GTTM_CONTRACT_ADDRESS and RPC_URL for a real diagnostic."));
    return;
  }

  const chainCheck = await pingChain();
  results.push({
    name: "RPC",
    ok: chainCheck.ok,
    detail: chainCheck.ok ? `block #${chainCheck.blockNumber}` : chainCheck.reason,
  });
  results.push({ name: "Chain", ok: chainCheck.ok, detail: `chain id ${config.chainId}` });

  let tokenOk = false;
  let tokenDetail = "";
  try {
    const token = await readTokenInfo();
    tokenOk = token.contractExists;
    tokenDetail = token.contractExists ? `${token.symbol ?? "?"} · ${token.decimals} decimals` : "no bytecode at configured address";
  } catch (e: any) {
    tokenDetail = e?.shortMessage ?? e?.message ?? "read failed";
  }
  results.push({ name: "Contract", ok: tokenOk, detail: tokenDetail });
  results.push({ name: "Token metadata", ok: tokenOk, detail: tokenDetail });

  for (const r of results) {
    console.log(`${r.ok ? pass(r.name) : fail(r.name)}${r.detail ? dim(`  — ${r.detail}`) : ""}`);
  }

  console.log();
  const allOk = results.every((r) => r.ok);
  console.log(allOk ? "READY FOR LAUNCH" : "NOT READY — see reasons above");
}
