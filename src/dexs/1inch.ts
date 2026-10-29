/**
 * 接入 Aggregation Router V6 的 swap，以及可确认池/币种的 V3 unoswap。
 *
 * swap，selector：0x07ed2379。
 * 参数：(address executor, SwapDescription desc, bytes data)。
 * SwapDescription = (address srcToken, address dstToken, address srcReceiver,
 *   address dstReceiver, uint256 amount, uint256 minReturnAmount, uint256 flags)。
 * 场景：按 API 生成的路由数据，由 executor 执行跨流动性来源的聚合兑换。
 * V6 的 swap 不再包含独立的 permit 参数，最低到账量取 minReturnAmount。
 * unoswap，selector 0x83800a8e：(uint256 token,uint256 amount,uint256 minReturn,uint256 dex)。
 * 输出币不在参数中；仅在可独立推导 V3 池地址及方向时返回结果。
 *
 * 官方文档：https://business.1inch.com/portal/documentation/apis/swap/classic-swap/introduction
 * Ethereum 官方 Router 的已验证实现源码与 ABI：
 * https://sourcify.dev/server/v2/contract/1/0x111111125421ca6dc452d289314280a0f8842a65?fields=abi,sources
 */
import { CHAINS_ENUM } from "@debank/common";
import { getChainById } from "../chain";
import { Interface } from "@ethersproject/abi";
import type { TxWithChainId, DecodeCalldataResult } from "../calldata/types";
import { generateGetQuote, normalizeEeeeToken } from "../utils";
import { OneInchABI } from "../abi";
import { DEX_ENUM } from "../consts";
import { decodeUnoswap } from "../calldata/oneinch/unoswap";

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

  if (result.name === "unoswap") return decodeUnoswap(result.args, tx);

  if (result.name !== "swap") {
    return null;
  }

  const [, desc] = result.args;
  const { srcToken, dstToken, dstReceiver, amount, minReturnAmount } = desc;

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
