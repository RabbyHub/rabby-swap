import type { Result } from "@ethersproject/abi";
import { isSameAddress } from "../../utils";

// coins(uint256) checked on Ethereum; the pool uses an immutable minimal proxy.
// https://www.curve.finance/dex/ethereum/pools/0x390f3595bCa2Df7d23783dFd126427CCeb997BF4
// https://etherscan.io/address/0x67fe41A94e779CcFa22cff02cc2957DC9C0e4286#code
const pools: Record<number, Record<string, readonly string[]>> = {
  1: {
    "0x390f3595bca2df7d23783dfd126427cceb997bf4": [
      "0xdac17f958d2ee523a2206206994597c13d831ec7",
      "0xf939e0a03fb07f59a73314e73794be0e57ac1b4e",
    ],
  },
};

export const getCurveOutput = (
  input: string,
  pool: string,
  dex: Result[number],
  chainId: number
): string | undefined => {
  const coins = pools[chainId]?.[pool.toLowerCase()];
  if (!coins) return undefined;
  // Router V6 _curfe uses byte offsets for getters, but indexes for swaps.
  // https://etherscan.io/address/0x111111125421ca6dc452d289314280a0f8842a65#code
  const byte = (offset: number) => dex.shr(offset).and(255).toNumber();
  const selector = byte(184);
  const fromIndex = byte(224);
  const toIndex = byte(232);
  const hasReceiver = selector === 2;
  // shortcut: only verified plain ERC20 pools are supported; add pool metadata
  // and matching ABI/flag handling before accepting underlying/native variants.
  if (
    (selector !== 0 && selector !== 2) ||
    byte(192) !== 8 || // coins(uint256), selector 0xc6610657
    byte(208) !== 8 ||
    byte(200) !== fromIndex ||
    byte(216) !== toIndex ||
    fromIndex === toIndex ||
    !coins[fromIndex] ||
    !coins[toIndex] ||
    !isSameAddress(input, coins[fromIndex]) ||
    // Bits 240..249 control native conversion, extra arguments and callbacks.
    !dex
      .shr(240)
      .and(0x3ff)
      .eq(hasReceiver ? 0x10 : 0)
  )
    return undefined;
  return coins[toIndex];
};
