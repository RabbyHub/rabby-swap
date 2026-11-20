import { CHAINS_ENUM, KnownChainEnum } from "../chains";
import { getChainById } from "../chain";
import { Interface } from "@ethersproject/abi";

import type { TxWithChainId, DecodeCalldataResult } from "../calldata/types";
import {
  generateGetQuote,
  normalizeEeeeToken,
  resolveToTokenReceiver,
} from "../utils";
import { KyberswapABI } from "../abi";
import { DEX_ENUM } from "../consts";

// eth op arb bsc avax ftm cro matic aurora linea btt oas

export const SUPPORT_CHAINS: KnownChainEnum[] = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.AVAX,
  // CHAINS_ENUM.FTM,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.AURORA,
  CHAINS_ENUM.LINEA,
  // CHAINS_ENUM.BTT,
  CHAINS_ENUM.BASE,
  CHAINS_ENUM.SONIC,
  CHAINS_ENUM.MANTLE,
  CHAINS_ENUM.BERA,
  // CHAINS_ENUM.ERA,
  CHAINS_ENUM.SCRL,
  CHAINS_ENUM.RONIN,
  CHAINS_ENUM.HYPER,
  CHAINS_ENUM.UNI,
  CHAINS_ENUM.PLASMA,
  CHAINS_ENUM.HOOD,
  CHAINS_ENUM.ARC,
  // No prev2 support
  // CHAINS_ENUM.ROSE,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "kyberswap",
  dex: DEX_ENUM.KYBERSWAP,
});

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = getChainById(tx.chainId);
  if (!chain) return null;
  const contractInterface = new Interface(KyberswapABI);
  const result = contractInterface.parseTransaction({ data: tx.data });

  let desc;

  if (result.name === "swapSimpleMode") {
    const [, swapDesc] = result.args;
    desc = swapDesc;
  } else if (result.name === "swap") {
    const [execution] = result.args;
    desc = execution.desc;
  }

  const { srcToken, amount, dstReceiver, dstToken, minReturnAmount } = desc;

  if (!srcToken || !amount || !dstReceiver || !dstToken || !minReturnAmount) {
    return null;
  }

  return {
    fromToken: normalizeEeeeToken(srcToken, chain.nativeTokenAddress),
    fromTokenAmount: amount.toString(),
    toToken: normalizeEeeeToken(dstToken, chain.nativeTokenAddress),
    minReceiveToTokenAmount: minReturnAmount.toString(),
    toTokenReceiver: resolveToTokenReceiver(dstReceiver, tx.from),
  };
};
