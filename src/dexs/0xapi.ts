import { Interface } from "@ethersproject/abi";
import { CHAINS_ENUM } from "@debank/common";
import { getChainById } from "../chain";
import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote, normalizeEeeeToken } from "../utils";
import { ZeroXABI } from "../abi";
import { DEX_ENUM } from "../consts";

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.FTM,
  CHAINS_ENUM.AVAX,
  CHAINS_ENUM.ARBITRUM,
  // CHAINS_ENUM.CELO,
  CHAINS_ENUM.BASE,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "matcha",
  dex: DEX_ENUM.ZEROXAPI,
});

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = getChainById(tx.chainId);
  if (!chain) return null;
  const contractInterface = new Interface(ZeroXABI);
  const result = contractInterface.parseTransaction({ data: tx.data });
  if (result.name !== "transformERC20") {
    return null;
  }

  const [inputToken, outputToken, inputTokenAmount, minOutputTokenAmount] =
    result.args;

  if (!inputToken || !outputToken || !inputTokenAmount || !minOutputTokenAmount)
    return null;

  return {
    fromToken: normalizeEeeeToken(inputToken, chain.nativeTokenAddress),
    fromTokenAmount: inputTokenAmount.toString(),
    toToken: normalizeEeeeToken(outputToken, chain.nativeTokenAddress),
    minReceiveToTokenAmount: minOutputTokenAmount.toString(),
    toTokenReceiver: tx.from,
  };
};
