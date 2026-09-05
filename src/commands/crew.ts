import { header, dim } from "../ui/terminal.js";
import * as scout from "../agents/scout.js";
import * as mouth from "../agents/mouth.js";
import * as door from "../agents/door.js";
import * as wrench from "../agents/wrench.js";
import * as abacus from "../agents/abacus.js";
import * as ears from "../agents/ears.js";

const registry: Record<string, typeof scout> = { scout, mouth, door, wrench, abacus, ears };

export async function runCrew(agentName?: string) {
  if (agentName) {
    const agent = registry[agentName.toLowerCase()];
    if (!agent) {
      console.log(`unknown crew member: ${agentName}`);
      console.log(`try one of: ${Object.keys(registry).join(", ")}`);
      return;
    }
    console.log(header(`${agent.meta.name}`));
    console.log(dim(agent.meta.role));
    console.log();
    const lines = await agent.readout();
    for (const l of lines) console.log(l);
    return;
  }

  console.log(header("GTTM CREW"));
  console.log();
  for (const key of Object.keys(registry)) {
    const agent = registry[key];
    console.log(agent.meta.name);
    console.log(dim(agent.meta.role));
    console.log("● ACTIVE");
    console.log();
  }
  console.log("HUMAN");
  console.log(dim("final authority"));
  console.log("● ONLINE");
}
