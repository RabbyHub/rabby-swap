import { CHAINS_ENUM, CHAINS } from "@debank/common";
import { Interface } from "@ethersproject/abi";
import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote, isSameAddress } from "../utils";
import { OneInchABI } from "../abi";
import { DEX_ENUM } from "../consts";

const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.FTM,
  CHAINS_ENUM.AVAX,
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.KLAY,
  CHAINS_ENUM.GNOSIS,
  CHAINS_ENUM.BASE,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "1inch",
  dex: DEX_ENUM.ONEINCH,
});

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = Object.values(CHAINS).find((item) => item.id === tx.chainId);
  if (!chain) return null;
  const contractInterface = new Interface(OneInchABI);
  const result = contractInterface.parseTransaction({ data: tx.data });

  if (result.name !== "swap") {
    return null;
  }

  const [executor, desc] = result.args;
  const [
    srcToken,
    dstToken,
    srcReceiver,
    dstReceiver,
    amount,
    minReturnAmount,
  ] = desc;

  if (!srcToken || !dstToken || !dstReceiver || !amount || !minReturnAmount)
    return null;

  return {
    fromToken: isSameAddress(srcToken, NATIVE_TOKEN)
      ? chain.nativeTokenAddress
      : srcToken,
    fromTokenAmount: amount.toString(),
    toToken: isSameAddress(dstToken, NATIVE_TOKEN)
      ? chain.nativeTokenAddress
      : dstToken,
    minReceiveToTokenAmount: minReturnAmount.toString(),
    toTokenReceiver: dstReceiver,
  };
};
