#!/usr/bin/env node
import { Command } from "commander";
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
  .description("six agents. one human. one mission. the open-source mission terminal for $GTTM.")
  .version("0.1.0");

program.command("mission").description("mission control overview").action(runMission);

program
  .command("crew [agent]")
  .description("show the crew, or one agent's readout (scout, mouth, door, wrench, abacus, ears)")
  .action(runCrew);

program.command("scout").description("SCOUT's chain intelligence report").action(runScout);
program.command("watch").description("live feed of chain activity").action(runWatch);
program.command("scan").description("broader intelligence scan of the configured contract").action(runScan);
program.command("treasury").description("ABACUS treasury / economics overview").action(runTreasury);
program.command("moon").description("mission progress toward the next milestone").action(runMoon);
program.command("doctor").description("diagnostics — config, RPC, chain, contract").action(runDoctor);

program.parseAsync(process.argv).catch((err: any) => {
  // Never a raw stack trace for a normal user.
  console.error(`\n${err?.message ?? "something went wrong"}\n`);
  process.exit(1);
});
