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
  [CHAINS_ENUM.GNOSIS]: "0x0000000000000000000000000000000000000000",
  [CHAINS_ENUM.AURORA]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.BOBA]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.KAVA]: "0x0000000000000000000000000000000000000000",
  [CHAINS_ENUM.METIS]: "0x0000000000000000000000000000000000000000",
  [CHAINS_ENUM.BASE]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  ["SONIC" as CHAINS_ENUM]: "0x0000000000000000000000000000000000000000",
  [CHAINS_ENUM.MANTLE]: "0x0000000000000000000000000000000000000000",
  ["BERA" as CHAINS_ENUM]: "0x0000000000000000000000000000000000000000",
  [CHAINS_ENUM.SCRL]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  ["UNi" as CHAINS_ENUM]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.MODE]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.BLAST]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.ERA]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.LINEA]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.PZE]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.MANTA]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  ["HYPER" as CHAINS_ENUM]: "0x0000000000000000000000000000000000000000",
  ["TAC" as CHAINS_ENUM]: "0x0000000000000000000000000000000000000000",
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
  CHAINS_ENUM.GNOSIS,
  "SONIC" as CHAINS_ENUM,
  CHAINS_ENUM.MANTLE,
  "BERA" as CHAINS_ENUM,
  CHAINS_ENUM.SCRL,
  "UNI" as CHAINS_ENUM,
  CHAINS_ENUM.MODE,
  CHAINS_ENUM.BLAST,
  "GRAVITY" as CHAINS_ENUM,
  "SEI" as CHAINS_ENUM,
  CHAINS_ENUM.ERA,
  CHAINS_ENUM.LINEA,
  CHAINS_ENUM.PZE,
  CHAINS_ENUM.MANTA,
  "HYPER" as CHAINS_ENUM,
  "TAC" as CHAINS_ENUM,
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
] as CHAINS_ENUM[];

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
