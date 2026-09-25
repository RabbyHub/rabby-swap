import { CHAINS_ENUM, CHAINS } from "@debank/common";
import { Interface } from "@ethersproject/abi";
import BigNumber from "bignumber.js";

import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote, isSameAddress, NULL_ADDRESS } from "../utils";
import { VurtoABI } from "../abi";
import { DEX_ENUM } from "../consts";

// VurtoSwapRouter uses address(0) as the native token sentinel.
const NATIVE_TOKEN = NULL_ADDRESS;

// Chained hops spend the router's whole balance of the previous output.
const AMOUNT_IN_BALANCE = new BigNumber(2).pow(256).minus(1).toFixed();

// Fee units are hundred-thousandths; executeMultiSwap charges a fixed 30 (3 bps).
const BPS_DENOMINATOR = 100000;
const FIXED_FEE_UNITS = 30;

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.GNOSIS,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.BASE,
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.AVAX,
  "UNI" as CHAINS_ENUM,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "vurto",
  dex: DEX_ENUM.VURTO,
});

const toChainToken = (token: string, nativeTokenAddress: string) =>
  isSameAddress(token, NATIVE_TOKEN) ? nativeTokenAddress : token;

/**
 * A route is one leg, or hops chained through the router: every leg but the
 * last pays the router, and the next one spends that whole balance. Any other
 * shape (e.g. an N:N basket) decodes with a zero input so it can never match
 * a single-pair quote.
 */
export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = Object.values(CHAINS).find((item) => item.id === tx.chainId);
  if (!chain) return null;
  const contractInterface = new Interface(VurtoABI);
  const result = contractInterface.parseTransaction({ data: tx.data });
  if (
    result.name !== "executeMultiSwap" &&
    result.name !== "executeMultiSwapWithFee"
  ) {
    return null;
  }

  const legs = result.args.legs;
  if (!legs || legs.length === 0) return null;
  const first = legs[0];
  const last = legs[legs.length - 1];

  let chained = true;
  for (let i = 1; i < legs.length; i++) {
    const prev = legs[i - 1];
    const leg = legs[i];
    if (
      !isSameAddress(prev.receiver, tx.to) ||
      !isSameAddress(leg.tokenIn, prev.tokenOut) ||
      leg.amountIn.toString() !== AMOUNT_IN_BALANCE
    ) {
      chained = false;
      break;
    }
  }

  const feeUnits =
    result.name === "executeMultiSwapWithFee"
      ? Number(result.args.feeUnits[legs.length - 1])
      : FIXED_FEE_UNITS;

  // The leg minimum is checked before the fee; the user is guaranteed the net.
  const grossMin = new BigNumber(last.minAmountOut.toString());
  const netMin = grossMin.minus(
    grossMin.times(feeUnits).div(BPS_DENOMINATOR).integerValue(BigNumber.ROUND_FLOOR)
  );

  return {
    fromToken: toChainToken(first.tokenIn, chain.nativeTokenAddress),
    fromTokenAmount: chained ? first.amountIn.toString() : "0",
    toToken: toChainToken(last.tokenOut, chain.nativeTokenAddress),
    minReceiveToTokenAmount: netMin.toFixed(),
    toTokenReceiver: last.receiver,
  };
};
