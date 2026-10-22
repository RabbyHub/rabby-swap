import { CHAINS, CHAINS_ENUM } from "@debank/common";
import { Interface } from "@ethersproject/abi";
import BigNumber from "bignumber.js";
import { TxWithChainId, DecodeCalldataResult } from "../quote";
import {
  generateGetQuote,
  isSameAddress,
  NULL_ADDRESS,
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
  const chain = Object.values(CHAINS).find((item) => item.id === tx.chainId);
  // Older @debank/common versions do not include Robinhood Chain yet.
  const nativeTokenAddress =
    chain?.nativeTokenAddress || (tx.chainId === 4663 ? "hood" : undefined);
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
    fromToken: isSameAddress(request.inputToken, NULL_ADDRESS)
      ? nativeTokenAddress
      : request.inputToken,
    fromTokenAmount: amount.toFixed(0),
    toToken: isSameAddress(request.outputToken, NULL_ADDRESS)
      ? nativeTokenAddress
      : request.outputToken,
    // The contract checks this minimum against the recipient's post-fee output.
    minReceiveToTokenAmount: request.minOutputAmount.toString(),
    toTokenReceiver: resolveToTokenReceiver(recipient, tx.from),
  };
};
