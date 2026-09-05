import chalk from "chalk";

const DIVIDER = "─".repeat(42);

export function header(title: string): string {
  return `${chalk.bold.white(title)}\n${chalk.gray(DIVIDER)}`;
}

export function divider(): string {
  return chalk.gray(DIVIDER);
}

export function demoBanner(): string {
  return chalk.bgYellow.black.bold(" DEMO MODE ") + chalk.yellow(" — no GTTM_CONTRACT_ADDRESS configured. numbers below are fake, on purpose.");
}

export function ok(label: string): string {
  return `${chalk.green("●")} ${label}`;
}

export function warn(label: string): string {
  return `${chalk.yellow("●")} ${label}`;
}

export function err(label: string): string {
  return `${chalk.red("●")} ${label}`;
}

/** Distinct glyphs, not just color, for pass/fail — readable without a TTY. */
export function pass(label: string): string {
  return `${chalk.green("✓")} ${label}`;
}

export function fail(label: string): string {
  return `${chalk.red("✗")} ${label}`;
}

export function dim(s: string): string {
  return chalk.gray(s);
}

export function label(key: string, value: string, width = 15): string {
  return `${chalk.gray(key.padEnd(width))} ${value}`;
}

export function verdictColor(verdict: string): string {
  if (verdict === "BULLISH") return chalk.green.bold(verdict);
  if (verdict === "BEARISH") return chalk.red.bold(verdict);
  if (verdict === "WATCH") return chalk.yellow.bold(verdict);
  return chalk.gray.bold(verdict);
}
