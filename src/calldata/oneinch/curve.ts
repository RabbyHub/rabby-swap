import type { Result } from "@ethersproject/abi";
import { isSameAddress } from "../../utils";
import { CURVE_POOLS } from "./config";

/** Curve 原生 ETH 标记，实际使用由 bit 242 控制。 */
export const ETH_SENTINEL = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
/** AggregationRouterV6 `_CURVE_SWAP_USE_ETH_OFFSET`。 */
const CURVE_USE_ETH_FLAGS = 0x4;

export const getCurveOutput = (
  input: string,
  pool: string,
  dex: Result[number],
  chainId: number
): string | undefined => {
  const metadata = CURVE_POOLS[chainId]?.[pool.toLowerCase()];
  const coins = metadata?.coins;
  if (!coins) return undefined;
  // Router V6 _curfe uses byte offsets for getters, but indexes for swaps.
  // https://etherscan.io/address/0x111111125421ca6dc452d289314280a0f8842a65#code
  const byte = (offset: number) => dex.shr(offset).and(255).toNumber();
  const selector = byte(184);
  const fromIndex = byte(224);
  const toIndex = byte(232);
  const hasReceiver = selector === 2;
  const output = coins[toIndex];
  const flags = dex.shr(240).and(0x3ff);
  const usesNativeEth =
    isSameAddress(input, ETH_SENTINEL) ||
    (!!output && isSameAddress(output, ETH_SENTINEL));
  // shortcut: support verified plain pools; verify other conversion flags before adding them.
  if (
    (selector !== 0 && selector !== 2) ||
    (hasReceiver && !metadata?.hasReceiver) ||
    byte(192) !== 8 || // coins(uint256), selector 0xc6610657
    byte(208) !== 8 ||
    byte(200) !== fromIndex ||
    byte(216) !== toIndex ||
    fromIndex === toIndex ||
    !coins[fromIndex] ||
    !output ||
    !isSameAddress(input, coins[fromIndex]) ||
    // Bits 240..249 control native conversion, extra arguments and callbacks.
    !(usesNativeEth
      ? selector === 0 && flags.eq(CURVE_USE_ETH_FLAGS)
      : flags.eq(hasReceiver ? 0x10 : 0))
  )
    return undefined;
  return output;
};
