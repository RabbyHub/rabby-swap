import { Interface } from "@ethersproject/abi";
import { CHAINS_ENUM } from "@debank/common";
import { getChainById } from "../chain";
import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote, normalizeEeeeToken } from "../utils";
import { ParaSwapV6ABI } from "../abi";
import { DEX_ENUM } from "../consts";

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.AVAX,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.ARBITRUM,
  // CHAINS_ENUM.FTM,
  CHAINS_ENUM.BASE,
  CHAINS_ENUM.GNOSIS,
  "UNI" as CHAINS_ENUM,
  "SONIC" as CHAINS_ENUM,
  // CHAINS_ENUM.PZE,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "paraswap_v6",
  dex: DEX_ENUM.PARASWAPV6,
});

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = getChainById(tx.chainId);
  const nullAddress = "0x0000000000000000000000000000000000000000";

  if (!chain) return null;

  const contractInterface = new Interface(ParaSwapV6ABI);
  const result = contractInterface.parseTransaction({
    data: tx.data,
  });
  switch (result.name) {
    case "swapExactAmountInOnUniswapV2":
    case "swapExactAmountInOnUniswapV3": {
      const [data] = result.args;
      const [
        srcToken,
        destToken,
        fromAmount,
        toAmount,
        quotedAmount,
        metadata,
        beneficiary,
      ] = data;
      if (!srcToken || !destToken || !fromAmount || !toAmount) return null;
      return {
        fromToken: normalizeEeeeToken(srcToken, chain.nativeTokenAddress),
        fromTokenAmount: fromAmount.toString(),
        toToken: normalizeEeeeToken(destToken, chain.nativeTokenAddress),
        minReceiveToTokenAmount: toAmount.toString(),
        toTokenReceiver: beneficiary === nullAddress ? tx.from : beneficiary,
      };
    }
    case "swapExactAmountIn": {
      const [_, data] = result.args;
      const [
        srcToken,
        destToken,
        fromAmount,
        toAmount,
        quotedAmount,
        metadata,
        beneficiary,
      ] = data;
      if (!srcToken || !destToken || !fromAmount || !toAmount) return null;
      return {
        fromToken: normalizeEeeeToken(srcToken, chain.nativeTokenAddress),
        fromTokenAmount: fromAmount.toString(),
        toToken: normalizeEeeeToken(destToken, chain.nativeTokenAddress),
        minReceiveToTokenAmount: toAmount.toString(),
        toTokenReceiver: beneficiary === nullAddress ? tx.from : beneficiary,
      };
    }
    case "swapExactAmountInOnCurveV1": {
      const [data] = result.args;
      const [
        curveData,
        curveAssets,
        srcToken,
        destToken,
        fromAmount,
        toAmount,
        quotedAmount,
        metadata,
        beneficiary,
      ] = data;
      if (!srcToken || !destToken || !fromAmount || !toAmount) return null;
      return {
        fromToken: normalizeEeeeToken(srcToken, chain.nativeTokenAddress),
        fromTokenAmount: fromAmount.toString(),
        toToken: normalizeEeeeToken(destToken, chain.nativeTokenAddress),
        minReceiveToTokenAmount: toAmount.toString(),
        toTokenReceiver: beneficiary === nullAddress ? tx.from : beneficiary,
      };
    }
    case "swapExactAmountInOnCurveV2": {
      const [data] = result.args;
      const [
        curveData,
        i,
        j,
        poolAddress,
        srcToken,
        destToken,
        fromAmount,
        toAmount,
        quotedAmount,
        metadata,
        beneficiary,
      ] = data;
      if (!srcToken || !destToken || !fromAmount || !toAmount) return null;
      return {
        fromToken: normalizeEeeeToken(srcToken, chain.nativeTokenAddress),
        fromTokenAmount: fromAmount.toString(),
        toToken: normalizeEeeeToken(destToken, chain.nativeTokenAddress),
        minReceiveToTokenAmount: toAmount.toString(),
        toTokenReceiver: beneficiary === nullAddress ? tx.from : beneficiary,
      };
    }
    // swapExactAmountInOnBalancerV2
    // swapOnAugustusRFQTryBatchFill
    default:
      return null;
  }
};
