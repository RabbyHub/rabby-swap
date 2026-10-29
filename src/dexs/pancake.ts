import { CHAINS_ENUM } from "@debank/common";
import { getChainById } from "../chain";
import { Interface } from "@ethersproject/abi";
import BigNumber from "bignumber.js";
import type { TxWithChainId, DecodeCalldataResult } from "../calldata/types";
import {
  generateGetQuote,
  normalizeZeroAddressToken,
  resolveToTokenReceiver,
} from "../utils";
import { PancakeSwapABI } from "../abi";
import { DEX_ENUM } from "../consts";

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.BASE,
  "HOOD" as CHAINS_ENUM,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "pancake",
  dex: DEX_ENUM.PANCAKESWAP,
});

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const nativeTokenAddress = getChainById(tx.chainId)?.nativeTokenAddress;
  if (!nativeTokenAddress) return null;

  const contractInterface = new Interface(PancakeSwapABI);
  const result = contractInterface.parseTransaction({ data: tx.data });
  if (result.name !== "swapExactIn") return null;

  const { request, routesAmount, recipient } = result.args;
  // Aggregator._swapExactIn sums the exact input budget across split routes.
  const amount = (routesAmount as { toString(): string }[]).reduce<BigNumber>(
    (total, value) => total.plus(value.toString()),
    new BigNumber(0)
  );

  return {
    fromToken: normalizeZeroAddressToken(request.inputToken, nativeTokenAddress),
    fromTokenAmount: amount.toFixed(0),
    toToken: normalizeZeroAddressToken(request.outputToken, nativeTokenAddress),
    // The contract checks this minimum against the recipient's post-fee output.
    minReceiveToTokenAmount: request.minOutputAmount.toString(),
    toTokenReceiver: resolveToTokenReceiver(recipient, tx.from),
  };
};
