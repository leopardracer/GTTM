#!/usr/bin/env node
import { Command } from "commander";
import { runHunt } from "./commands/hunt.js";
import { runMission } from "./commands/mission.js";
import { runCrew } from "./commands/crew.js";
import { runScout } from "./commands/scout.js";
import { runWatch } from "./commands/watch.js";
import { runScan } from "./commands/scan.js";
import { runTreasury } from "./commands/treasury.js";
import { runMoon } from "./commands/moon.js";
import { runDoctor } from "./commands/doctor.js";

const program = new Command();

program
  .name("gttm")
  .description("a Robinhood Chain sniper cockpit. detect new launches, score them, decide — read only.")
  .version("0.3.0");

program.command("hunt").description("live feed of every new Pons V2 launch on the chain, scored").action(runHunt);

program.command("mission").description("$GTTM token dashboard — mission control overview").action(runMission);

program
  .command("crew [agent]")
  .description("show the $GTTM crew, or one agent's readout (scout, mouth, door, wrench, abacus, ears)")
  .action(runCrew);

program.command("scout").description("SCOUT's chain intelligence report on $GTTM").action(runScout);
program.command("watch").description("live feed of $GTTM chain activity").action(runWatch);
program.command("scan").description("broader intelligence scan of the configured $GTTM contract").action(runScan);
program.command("treasury").description("ABACUS treasury / economics overview for $GTTM").action(runTreasury);
program.command("moon").description("$GTTM's progress on its own roadmap").action(runMoon);
program.command("doctor").description("diagnostics — config, RPC, chain, contract").action(runDoctor);

program.parseAsync(process.argv).catch((err: any) => {
  // Never a raw stack trace or viem's full multi-line dump for a normal user.
  const message = err?.shortMessage ?? err?.message ?? "something went wrong";
  console.error(`\n${message}\n`);
  process.exit(1);
});
