import BigNumber from "bignumber.js";
import type { DecodeCalldataResult } from "../types";
import { isSameAddress } from "../../utils";
import { ARC_CHAIN_ID, ARC_ERC20_USDC, ARC_NATIVE_SCALE } from "../../consts";

// Arc funds its ERC20 USDC route through msg.value without a WETH-style wrap.
// Fix the complete input before reading individual router-funded split legs,
// just as SwapProxy ingress / WRAP_ETH does on other routes. Keep ERC20 units
// until normalizeUniAssets converts the final result to native units.
// https://docs.arc.io/arc/concepts/stablecoin-native-model#two-interfaces-one-balance
export const getArcNativeInputAmount = (
  token: string,
  chainId: number,
  txValue: string
): string | undefined =>
  chainId === ARC_CHAIN_ID &&
  isSameAddress(token, ARC_ERC20_USDC) &&
  new BigNumber(txValue).gt(0)
    ? new BigNumber(txValue).idiv(ARC_NATIVE_SCALE).toFixed(0)
    : undefined;

// Compare asset identity for refunds only. Do not merge raw native (18) and
// ERC20 (6) amounts or balances: they share an asset, but use different units.
// https://docs.arc.io/arc/concepts/stablecoin-native-model#two-interfaces-one-balance
export const isSameUniAsset = (
  a: string,
  b: string,
  chainId: number,
  native: string
) => {
  const identity = (token: string) =>
    chainId === ARC_CHAIN_ID && isSameAddress(token, ARC_ERC20_USDC)
      ? native
      : token;
  return isSameAddress(identity(a), identity(b));
};

// Arc exposes one USDC balance as native (18 decimals) and ERC20 (6 decimals).
// Normalize both the asset and its amount together, after route aggregation.
// https://docs.arc.io/arc/concepts/stablecoin-native-model#two-interfaces-one-balance
// Tempo pathUSD is a real 6-decimal TIP20; it must retain its contract address.
export const normalizeUniAssets = (
  result: DecodeCalldataResult,
  chainId: number,
  native: string
): DecodeCalldataResult => {
  if (chainId !== ARC_CHAIN_ID || isSameAddress(native, ARC_ERC20_USDC))
    return result;
  const nativeIn = isSameAddress(result.fromToken, ARC_ERC20_USDC);
  const nativeOut = isSameAddress(result.toToken, ARC_ERC20_USDC);
  return {
    ...result,
    ...(nativeIn
      ? {
          fromToken: native,
          fromTokenAmount: new BigNumber(result.fromTokenAmount)
            .times(ARC_NATIVE_SCALE)
            .toFixed(),
        }
      : {}),
    ...(nativeOut
      ? {
          toToken: native,
          minReceiveToTokenAmount: new BigNumber(result.minReceiveToTokenAmount)
            .times(ARC_NATIVE_SCALE)
            .toFixed(),
        }
      : {}),
  };
};
