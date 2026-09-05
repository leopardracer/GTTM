import "dotenv/config";
import { z } from "zod";

const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "must be a 0x-prefixed 40-hex-char address");

const envSchema = z.object({
  CHAIN_ID: z.coerce.number().default(4663),
  RPC_URL: z.string().optional().default(""),
  GTTM_CONTRACT_ADDRESS: z
    .union([addressSchema, z.literal("")])
    .optional()
    .default(""),
  GTTM_DECIMALS: z.coerce.number().default(18),
  POOL_ADDRESS: z.union([addressSchema, z.literal("")]).optional().default(""),
  BUYBACK_WALLET: z.union([addressSchema, z.literal("")]).optional().default(""),
  PAIR_ASSET_COINGECKO_ID: z.string().optional().default("ethereum"),
  WATCH_POLL_MS: z.coerce.number().default(5000),
  SIGNAL_WINDOW_BLOCKS: z.coerce.number().default(50_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid configuration in .env:");
  for (const issue of parsed.data ? [] : parsed.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

const env = parsed.data;

export const config = {
  chainId: env.CHAIN_ID,
  rpcUrl: env.RPC_URL,
  tokenAddress: (env.GTTM_CONTRACT_ADDRESS || undefined) as `0x${string}` | undefined,
  tokenDecimals: env.GTTM_DECIMALS,
  poolAddress: (env.POOL_ADDRESS || undefined) as `0x${string}` | undefined,
  buybackWallet: (env.BUYBACK_WALLET || undefined) as `0x${string}` | undefined,
  pairAssetCoingeckoId: env.PAIR_ASSET_COINGECKO_ID,
  watchPollMs: env.WATCH_POLL_MS,
  signalWindowBlocks: BigInt(env.SIGNAL_WINDOW_BLOCKS),

  /** No contract configured -> everything runs on clearly labeled mock data. */
  isDemo(): boolean {
    return !env.GTTM_CONTRACT_ADDRESS;
  },

  /** RPC_URL is required for any real (non-demo) chain read. */
  requireRpcUrl(): string {
    if (!env.RPC_URL) {
      throw new Error(
        "RPC_URL is not set in .env. See .env.example and https://docs.robinhood.com/chain/"
      );
    }
    return env.RPC_URL;
  },

  requireTokenAddress(): `0x${string}` {
    if (!env.GTTM_CONTRACT_ADDRESS) {
      throw new Error("GTTM_CONTRACT_ADDRESS is not set — running in demo mode instead.");
    }
    return env.GTTM_CONTRACT_ADDRESS as `0x${string}`;
  },
};
