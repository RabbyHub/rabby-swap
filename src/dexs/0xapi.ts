import { Interface } from "@ethersproject/abi";
import { CHAINS_ENUM, CHAINS } from "@debank/common";
import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote, isSameAddress } from "../utils";
import { ZeroXABI } from "../abi";
import { DEX_ENUM } from "../consts";

const NATIVE_TOKEN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

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
  const chain = Object.values(CHAINS).find((item) => item.id === tx.chainId);
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
    fromToken: isSameAddress(inputToken, NATIVE_TOKEN)
      ? chain.nativeTokenAddress
      : inputToken,
    fromTokenAmount: inputTokenAmount.toString(),
    toToken: isSameAddress(outputToken, NATIVE_TOKEN)
      ? chain.nativeTokenAddress
      : outputToken,
    minReceiveToTokenAmount: minOutputTokenAmount.toString(),
    toTokenReceiver: tx.from,
  };
};
