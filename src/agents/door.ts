export const meta = { name: "DOOR", role: "opportunity discovery" };

export async function readout(): Promise<string[]> {
  return [
    "no partnership/opportunity feed wired up in v0.1 — DOOR is a placeholder crew slot.",
    "future architecture: plugin system for third-party agents (see README roadmap).",
  ];
}
