import { CHAINS_ENUM, CHAINS } from "@debank/common";
import { Interface } from "@ethersproject/abi";

import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote, isSameAddress } from "../utils";
import { KyberswapABI } from "../abi";
import { DEX_ENUM } from "../consts";

const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// eth op arb bsc avax ftm cro matic aurora linea btt oas

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.AVAX,
  CHAINS_ENUM.FTM,
  CHAINS_ENUM.CRO,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.AURORA,
  CHAINS_ENUM.LINEA,
  // CHAINS_ENUM.BTT,
  CHAINS_ENUM.BASE,
  "SONIC" as CHAINS_ENUM,
  CHAINS_ENUM.MANTLE,
  "BERA" as CHAINS_ENUM,
  CHAINS_ENUM.ERA,
  CHAINS_ENUM.SCRL,
  CHAINS_ENUM.RONIN,
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
  const chain = Object.values(CHAINS).find((item) => item.id === tx.chainId);
  if (!chain) return null;
  const contractInterface = new Interface(KyberswapABI);
  const result = contractInterface.parseTransaction({ data: tx.data });

  let desc;

  if (result.name === "swapSimpleMode") {
    const [execution] = result.args;

    desc = execution.desc;
  }
  if (result.name === "swap") {
    const [execution] = result.args;
    desc = execution.desc;
  }

  const { srcToken, amount, dstReceiver, dstToken, minReturnAmount } = desc;

  if (!srcToken || !amount || !dstReceiver || !dstToken || !minReturnAmount) {
    return null;
  }

  return {
    fromToken: isSameAddress(srcToken, NATIVE_TOKEN)
      ? chain.nativeTokenAddress
      : srcToken,
    fromTokenAmount: amount.toString(),
    toToken: isSameAddress(dstToken, NATIVE_TOKEN)
      ? chain.nativeTokenAddress
      : dstToken,
    minReceiveToTokenAmount: minReturnAmount.toString(),
    toTokenReceiver: tx.from,
  };
};
