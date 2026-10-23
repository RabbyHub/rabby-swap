import { CHAINS_ENUM } from "@debank/common";
import { getChainById } from "../chain";
import { Interface } from "@ethersproject/abi";
import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote, normalizeEeeeToken } from "../utils";
import { OneInchABI } from "../abi";
import { DEX_ENUM } from "../consts";

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.AVAX,
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.GNOSIS,
  CHAINS_ENUM.BASE,
  CHAINS_ENUM.ERA,
  CHAINS_ENUM.LINEA,
  "HOOD" as CHAINS_ENUM,
  "ARC" as CHAINS_ENUM,
  CHAINS_ENUM.CRO,
  "UNI" as CHAINS_ENUM,
  "MONAD" as CHAINS_ENUM,
  "SONIC" as CHAINS_ENUM,
  "HYPER" as CHAINS_ENUM,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "1inch_v6",
  dex: DEX_ENUM.ONEINCH,
});

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = getChainById(tx.chainId);
  if (!chain) return null;
  const contractInterface = new Interface(OneInchABI);
  const result = contractInterface.parseTransaction({ data: tx.data });

  if (result.name !== "swap") {
    return null;
  }

  const [, desc] = result.args;
  const {
    srcToken,
    dstToken,
    dstReceiver,
    amount,
    minReturnAmount,
  } = desc;

  if (!srcToken || !dstToken || !dstReceiver || !amount || !minReturnAmount)
    return null;

  return {
    fromToken: normalizeEeeeToken(srcToken, chain.nativeTokenAddress),
    fromTokenAmount: amount.toString(),
    toToken: normalizeEeeeToken(dstToken, chain.nativeTokenAddress),
    minReceiveToTokenAmount: minReturnAmount.toString(),
    toTokenReceiver: dstReceiver,
  };
};
