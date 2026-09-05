export const meta = { name: "EARS", role: "community intelligence" };

export async function readout(): Promise<string[]> {
  return [
    "no social/sentiment data source configured in v0.1 — EARS is a placeholder crew slot.",
    "future architecture: Telegram/Discord + X monitoring for real sentiment (see README roadmap).",
  ];
}
