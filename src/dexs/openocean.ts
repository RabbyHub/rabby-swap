import { Interface } from "@ethersproject/abi";
import { CHAINS_ENUM } from "@debank/common";
import { getChainById } from "../chain";
import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote, isSameAddress, resolveToTokenReceiver } from "../utils";
import { OpenOceanABI } from "../abi";
import { DEX_ENUM } from "../consts";

// OpenOcean 在不同链使用不同的原生币标记，按当前链的映射匹配后再转换。
// 保留各链的约定，避免将其他链的标记或普通代币地址误当作当前链的原生币。
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
  [CHAINS_ENUM.CELO]: "0x471EcE3750Da237f93B8E339c536989b8978a438",
  [CHAINS_ENUM.METIS]: "0x0000000000000000000000000000000000000000",
  [CHAINS_ENUM.BASE]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  ["SONIC" as CHAINS_ENUM]: "0x0000000000000000000000000000000000000000",
  [CHAINS_ENUM.MANTLE]: "0x0000000000000000000000000000000000000000",
  ["BERA" as CHAINS_ENUM]: "0x0000000000000000000000000000000000000000",
  [CHAINS_ENUM.SCRL]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  ["UNI" as CHAINS_ENUM]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.MODE]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.BLAST]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.ERA]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.LINEA]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.PZE]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.MANTA]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  ["HYPER" as CHAINS_ENUM]: "0x0000000000000000000000000000000000000000",
  ["TAC" as CHAINS_ENUM]: "0x0000000000000000000000000000000000000000",
  ["PLASMA" as CHAINS_ENUM]: "0x0000000000000000000000000000000000000000",
  ["MONAD" as CHAINS_ENUM]: "0x0000000000000000000000000000000000000000",
  [CHAINS_ENUM.RSK]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  ["HOOD" as CHAINS_ENUM]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  ["SEI" as CHAINS_ENUM]: "0x0000000000000000000000000000000000000000",
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
  "PLASMA" as CHAINS_ENUM,
  "MONAD" as CHAINS_ENUM,
  CHAINS_ENUM.RSK,
  CHAINS_ENUM.KAVA,
  CHAINS_ENUM.CELO,
  "HOOD" as CHAINS_ENUM,
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
  const chain = getChainById(tx.chainId);
  if (!chain) return null;
  const contractInterface = new Interface(OpenOceanABI);
  const result = contractInterface.parseTransaction({ data: tx.data });
  if (result.name !== "swap") {
    return null;
  }

  const [, data] = result.args;
  const {
    srcToken,
    dstToken,
    dstReceiver,
    amount,
    minReturnAmount,
  } = data;

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
    toTokenReceiver: resolveToTokenReceiver(dstReceiver, tx.from),
  };
};
