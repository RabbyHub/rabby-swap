import { Interface } from "@ethersproject/abi";
import { CHAINS_ENUM, CHAINS } from "@debank/common";
import {
  TxWithChainId,
  DecodeCalldataResult,
} from "../quote";
import { generateGetQuote, isSameAddress } from "../utils";
import { ParaSwapABI } from "../abi";
import { DEX_ENUM } from "../consts";
const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";


export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.AVAX,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.FTM,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "paraswap",
  dex: DEX_ENUM.PARASWAP,
});

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = Object.values(CHAINS).find((item) => item.id === tx.chainId);
  const nullAddress = "0x0000000000000000000000000000000000000000";

  if (!chain) return null;

  const contractInterface = new Interface(ParaSwapABI);
  const result = contractInterface.parseTransaction({
    data: tx.data,
  });
  switch (result.name) {
    case "simpleSwap": {
      const [data] = result.args;
      const [
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        expectedAmount,
        callees,
        exchangeData,
        startIndexes,
        values,
        beneficiary,
      ] = data;
      if (!fromToken || !toToken || !fromAmount || !toAmount) return null;
      return {
        fromToken: isSameAddress(fromToken, NATIVE_TOKEN)
          ? chain.nativeTokenAddress
          : fromToken,
        fromTokenAmount: fromAmount.toString(),
        toToken: isSameAddress(toToken, NATIVE_TOKEN)
          ? chain.nativeTokenAddress
          : toToken,
        minReceiveToTokenAmount: toAmount.toString(),
        toTokenReceiver: beneficiary === nullAddress ? tx.from : beneficiary,
      };
    }
    case "multiSwap": {
      const [data] = result.args;
      const [
        fromToken,
        fromAmount,
        toAmount,
        expectedAmount,
        beneficiary,
        path,
      ] = data;
      if (!fromToken || !fromAmount || !toAmount || !path || path.length <= 0)
        return null;
      const [toToken] = path[path.length - 1];
      return {
        fromToken: isSameAddress(fromToken, NATIVE_TOKEN)
          ? chain.nativeTokenAddress
          : fromToken,
        fromTokenAmount: fromAmount.toString(),
        toToken: isSameAddress(toToken, NATIVE_TOKEN)
          ? chain.nativeTokenAddress
          : toToken,
        minReceiveToTokenAmount: toAmount.toString(),
        toTokenReceiver: beneficiary === nullAddress ? tx.from : beneficiary,
      };
    }
    case "megaSwap":
      const [data] = result.args;
      const [
        fromToken,
        fromAmount,
        toAmount,
        expectedAmount,
        beneficiary,
        path,
      ] = data;
      if (!fromToken || !fromAmount || !toAmount || !path || path.length <= 0)
        return null;
      const [fromAmountPercent, swapPath] = path[0];
      const [toToken] = swapPath[swapPath.length - 1];
      return {
        fromToken: isSameAddress(fromToken, NATIVE_TOKEN)
          ? chain.nativeTokenAddress
          : fromToken,
        fromTokenAmount: fromAmount.toString(),
        toToken: isSameAddress(toToken, NATIVE_TOKEN)
          ? chain.nativeTokenAddress
          : toToken,
        minReceiveToTokenAmount: toAmount.toString(),
        toTokenReceiver: beneficiary === nullAddress ? tx.from : beneficiary,
      };
    default:
      return null;
  }
};
