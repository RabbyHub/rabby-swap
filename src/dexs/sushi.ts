import { CHAINS, CHAINS_ENUM } from "@debank/common";
import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote, isSameAddress } from "../utils";
import { DEX_ENUM } from "../consts";
import { Interface } from "@ethersproject/abi";
import { SushiABI } from "../abi";
const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.CELO,
  CHAINS_ENUM.KAVA,
  "NOVA" as CHAINS_ENUM,
  "ZETA" as CHAINS_ENUM,
  "KATANA" as CHAINS_ENUM,
  "HEMI" as CHAINS_ENUM,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "sushi",
  dex: DEX_ENUM.SUSHI,
});

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = Object.values(CHAINS).find((item) => item.id === tx.chainId);
  if (!chain) return null;
  const contractInterface = new Interface(SushiABI);
  const result = contractInterface.parseTransaction({ data: tx.data });
  if (result.name !== "snwap") {
    return null;
  }

  const [
    tokenIn,
    amountIn,
    recipient,
    tokenOut,
    amountOutMin,
    executor,
    executorData,
  ] = result.args;

  if (!tokenIn || !amountIn || !recipient || !tokenOut || !amountOutMin)
    return null;

  return {
    fromToken: isSameAddress(tokenIn, NATIVE_TOKEN)
      ? chain.nativeTokenAddress
      : tokenIn,
    fromTokenAmount: amountIn.toString(),
    toToken: isSameAddress(tokenOut, NATIVE_TOKEN)
      ? chain.nativeTokenAddress
      : tokenOut,
    minReceiveToTokenAmount: amountOutMin.toString(),
    toTokenReceiver: recipient,
  };
};
