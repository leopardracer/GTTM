/**
 * Deliberately empty.
 *
 * If $GTTM is still on the pons v2 bonding curve (pre-graduation), price and
 * liquidity are NOT reserve-based — they follow the curve contract's own
 * integer math. This project doesn't hardcode a curve address or ABI
 * because none was available to verify against the real pons v2 deployment;
 * inventing one would silently produce wrong numbers instead of an honest
 * "no pool yet."
 *
 * To close this gap for real:
 *   1. Get the factory / bonding-curve contract address + ABI from
 *      https://docs.ponsfamily.com/v2
 *   2. Add a `readCurveState(tokenAddress)` function here mirroring the
 *      contract's own buy/sell quote math.
 *   3. Have chain/liquidity.ts try the curve first, falling back to the
 *      generic pool reader once POOL_ADDRESS is set (post-graduation).
 *
 * Until then, `hasPool: false` from readLiquidity() is the correct answer,
 * not a bug.
 */
export {};
