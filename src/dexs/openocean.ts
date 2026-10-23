/**
 * 当前接入 OpenOcean 的两个聚合兑换方法：
 *
 * 1. swap，selector：0x90411a32。
 *    参数：(address caller, SwapDescription desc, CallDescription[] calls)。
 *    SwapDescription = (address srcToken, address dstToken, address srcReceiver,
 *      address dstReceiver, uint256 amount, uint256 minReturnAmount,
 *      uint256 guaranteedAmount, uint256 flags, address referrer, bytes permit)。
 *    场景：使用包含 guaranteedAmount 报价记录信息的完整描述执行聚合兑换。
 *
 * 2. simpleSwap，selector：0x0a9704d5。
 *    参数：(address caller, SimpleSwapDescription desc, CallDescription[] calls)。
 *    SimpleSwapDescription = (address srcToken, address dstToken, address srcReceiver,
 *      address dstReceiver, uint256 amount, uint256 minReturnAmount,
 *      uint256 flags, address referrer, bytes permit)。
 *    场景：使用省略 guaranteedAmount 的精简描述执行聚合兑换。
 *
 * CallDescription = (uint256 target, uint256 gasLimit, uint256 value, bytes data)。
 * 两种方法的最低到账量均取 minReturnAmount；零 dstReceiver 表示 msg.sender。
 * 官方部署地址：https://docs.openocean.finance/docs/contracts
 * Ethereum 官方 Router 的已验证实现源码与 ABI：
 * https://sourcify.dev/server/v2/contract/1/0xE29B6B6E96beFE1e9C6f948BcB5A3f71058bDA9B?fields=abi,sources
 */
import { Interface } from "@ethersproject/abi";
import type { Result } from "@ethersproject/abi";
import { CHAINS_ENUM } from "@debank/common";
import { getChainById } from "../chain";
import type { SwapChainInfo } from "../chain";
import { TxWithChainId, DecodeCalldataResult } from "../quote";
import {
  generateGetQuote,
  normalizeToken,
  resolveToTokenReceiver,
} from "../utils";
import { OpenOceanABI } from "../abi";
import { DEX_ENUM } from "../consts";

// OpenOcean 在不同链使用不同的原生币标记，按当前链的映射匹配后再转换。
// 保留各链的约定，避免将其他链的标记或普通代币地址误当作当前链的原生币。
// CELO 的 0x471e… 是实际代币地址，保留报价中的 ERC20 标识，不作为占位标记。
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
} as Partial<Record<CHAINS_ENUM, string>>;

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

const decodeSwap = (
  args: Result,
  chain: SwapChainInfo,
  txFrom: string
): DecodeCalldataResult | null => {
  const [, desc] = args;
  const {
    srcToken,
    dstToken,
    dstReceiver,
    amount,
    minReturnAmount,
  } = desc;

  if (!srcToken || !dstToken || !dstReceiver || !amount || !minReturnAmount)
    return null;

  const NATIVE_TOKEN = NATIVE_TOKENS[chain.enum];

  return {
    fromToken: normalizeToken(srcToken, chain.nativeTokenAddress, NATIVE_TOKEN),
    fromTokenAmount: amount.toString(),
    toToken: normalizeToken(dstToken, chain.nativeTokenAddress, NATIVE_TOKEN),
    minReceiveToTokenAmount: minReturnAmount.toString(),
    toTokenReceiver: resolveToTokenReceiver(dstReceiver, txFrom),
  };
};

const decodeSimpleSwap = (
  args: Result,
  chain: SwapChainInfo,
  txFrom: string
): DecodeCalldataResult | null => {
  const [, desc] = args;
  const {
    srcToken,
    dstToken,
    dstReceiver,
    amount,
    minReturnAmount,
  } = desc;

  if (!srcToken || !dstToken || !dstReceiver || !amount || !minReturnAmount)
    return null;

  const NATIVE_TOKEN = NATIVE_TOKENS[chain.enum];

  return {
    fromToken: normalizeToken(srcToken, chain.nativeTokenAddress, NATIVE_TOKEN),
    fromTokenAmount: amount.toString(),
    toToken: normalizeToken(dstToken, chain.nativeTokenAddress, NATIVE_TOKEN),
    minReceiveToTokenAmount: minReturnAmount.toString(),
    toTokenReceiver: resolveToTokenReceiver(dstReceiver, txFrom),
  };
};

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = getChainById(tx.chainId);
  if (!chain) return null;

  const contractInterface = new Interface(OpenOceanABI);
  const result = contractInterface.parseTransaction({ data: tx.data });
  switch (result.name) {
    case "swap":
      return decodeSwap(result.args, chain, tx.from);
    case "simpleSwap":
      return decodeSimpleSwap(result.args, chain, tx.from);
    default:
      return null;
  }
};
