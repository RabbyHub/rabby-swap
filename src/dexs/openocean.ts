import { Interface } from "@ethersproject/abi";
import { CHAINS_ENUM, CHAINS } from "@debank/common";
import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote, isSameAddress } from "../utils";
import { OpenOceanABI } from "../abi";
import { DEX_ENUM } from "../consts";

const NATIVE_TOKENS = {
  [CHAINS_ENUM.ETH]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.POLYGON]: "0x0000000000000000000000000000000000001010",
  [CHAINS_ENUM.BSC]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.OP]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.FTM]: "0x0000000000000000000000000000000000000000",
  [CHAINS_ENUM.AVAX]: "0x0000000000000000000000000000000000000000",
  [CHAINS_ENUM.ARBITRUM]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.CRO]: "0x0000000000000000000000000000000000000000",
  [CHAINS_ENUM.GNOSIS]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.AURORA]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.BOBA]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.KAVA]: "0x0000000000000000000000000000000000000000",
  [CHAINS_ENUM.METIS]: "0x0000000000000000000000000000000000000000",
  [CHAINS_ENUM.BASE]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
} as Record<CHAINS_ENUM, string>;

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.FTM,
  CHAINS_ENUM.AVAX,
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.CRO,
  CHAINS_ENUM.BASE,
  /**
   * 接口返回 swap error
   */
  // CHAINS_ENUM.METIS,
  /**
   * pre api v1
   */
  // CHAINS_ENUM.AURORA,
  /**
   * 未开源
   */
  // CHAINS_ENUM.GNOSIS,
  // CHAINS_ENUM.BOBA,
  // CHAINS_ENUM.KAVA, //pre api v1
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "openocean",
  dex: DEX_ENUM.OPENOCEAN,
});

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = Object.values(CHAINS).find((item) => item.id === tx.chainId);
  if (!chain) return null;
  const contractInterface = new Interface(OpenOceanABI);
  const result = contractInterface.parseTransaction({ data: tx.data });
  if (result.name !== "swap") {
    return null;
  }

  const [caller, data] = result.args;
  const [
    srcToken,
    dstToken,
    srcReceiver,
    dstReceiver,
    amount,
    minReturnAmount,
  ] = data;

  if (!srcToken || !dstToken || !dstReceiver || !amount || !minReturnAmount)
    return null;

  const NATIVE_TOKEN = NATIVE_TOKENS[chain.enum];

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
