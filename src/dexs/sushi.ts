/**
 * 当前接入 Sushi RedSnwapper 的两个兑换方法（不含只读方法 safeExecutor）：
 *
 * 1. snwap，selector：0x5f3bd1c8。
 *    参数：(address tokenIn, uint256 amountIn, address recipient, address tokenOut,
 *          uint256 amountOutMin, address executor, bytes executorData)。
 *    场景：一种输入币换一种输出币，由一个执行器完成兑换。
 *    官方文档：https://github.com/sushi-labs/sushi/blob/master/site/pages/contracts/red-snwapper.mdx#snwap
 *
 * 2. snwapMultiple，selector：0xd33721a5。
 *    参数：(InputToken[] inputTokens, OutputToken[] outputTokens, Executor[] executors)。
 *    InputToken = (address token, uint256 amountIn, address transferTo)。
 *    OutputToken = (address token, address recipient, uint256 amountOutMin)。
 *    Executor = (address executor, uint256 value, bytes data)。
 *    场景：把输入分配给多个目标（如兑换路由和手续费），再依次执行并检查输出。
 *    当前解析范围：同一种输入币、一个输出项；多资产或多输出无法由现有返回结构表达。
 *    官方文档：https://github.com/sushi-labs/sushi/blob/master/site/pages/contracts/red-snwapper.mdx#snwapmultiple
 *
 * 已验证源码：https://etherscan.io/address/0xac4c6e212a361c968f1725b4d055b47e63f80b75#code
 */
import { CHAINS_ENUM } from "@debank/common";
import { getChainById } from "../chain";
import type { TxWithChainId, DecodeCalldataResult } from "../calldata/types";
import { generateGetQuote, isSameAddress, normalizeEeeeToken } from "../utils";
import { DEX_ENUM } from "../consts";
import { Interface } from "@ethersproject/abi";
import type { Result } from "@ethersproject/abi";
import BigNumber from "bignumber.js";
import { SushiABI } from "../abi";
const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.CRO,
  CHAINS_ENUM.RSK,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.GNOSIS,
  CHAINS_ENUM.FUSE,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.MANTA,
  CHAINS_ENUM.FTM,
  CHAINS_ENUM.ERA,
  CHAINS_ENUM.METIS,
  CHAINS_ENUM.CORE,
  CHAINS_ENUM.KAVA,
  CHAINS_ENUM.MANTLE,
  CHAINS_ENUM.ZETA,
  CHAINS_ENUM.BASE,
  CHAINS_ENUM.MODE,
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.CELO,
  CHAINS_ENUM.AVAX,
  CHAINS_ENUM.LINEA,
  CHAINS_ENUM.BLAST,
  CHAINS_ENUM.SCRL,
  "MONAD" as CHAINS_ENUM,
  "SONIC" as CHAINS_ENUM,
  "XLAYER" as CHAINS_ENUM,
  "HYPER" as CHAINS_ENUM,
  "MEGAETH" as CHAINS_ENUM,
  "PLASMA" as CHAINS_ENUM,
  "APE" as CHAINS_ENUM,
  "HEMI" as CHAINS_ENUM,
  "BERA" as CHAINS_ENUM,
  "TAIKO" as CHAINS_ENUM,
  "KATANA" as CHAINS_ENUM,
  "HOOD" as CHAINS_ENUM,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "sushi",
  dex: DEX_ENUM.SUSHI,
});

const decodeSnwap = (
  args: Result,
  nativeTokenAddress: string,
  txValue: string
): DecodeCalldataResult | null => {
  const [tokenIn, amountIn, recipient, tokenOut, amountOutMin] = args;

  if (!tokenIn || !amountIn || !recipient || !tokenOut || !amountOutMin)
    return null;

  const nativeInput = isSameAddress(tokenIn, NATIVE_TOKEN);
  // 合约仍会将 msg.value 转给执行器；ERC20 输入不允许额外支付原生币。
  if (!nativeInput && !new BigNumber(txValue).isZero()) {
    return null;
  }

  return {
    fromToken: normalizeEeeeToken(tokenIn, nativeTokenAddress),
    // 原生币输入时合约不读取 amountIn，实际支付金额是 msg.value。
    fromTokenAmount: nativeInput
      ? new BigNumber(txValue).toFixed(0)
      : amountIn.toString(),
    toToken: normalizeEeeeToken(tokenOut, nativeTokenAddress),
    minReceiveToTokenAmount: amountOutMin.toString(),
    toTokenReceiver: recipient,
  };
};

const decodeSnwapMultiple = (
  args: Result,
  nativeTokenAddress: string,
  txValue: string
): DecodeCalldataResult | null => {
  const inputTokens: Result[] = args.inputTokens;
  const outputTokens: Result[] = args.outputTokens;
  if (!inputTokens.length || outputTokens.length !== 1) return null;

  const tokenIn: string = inputTokens[0].token;
  const nativeInput = isSameAddress(tokenIn, NATIVE_TOKEN);
  // 合约仍会将 msg.value 转给执行器；ERC20 输入不允许额外支付原生币。
  if (!nativeInput && !new BigNumber(txValue).isZero()) return null;

  if (
    inputTokens.some(
      (input) =>
        !isSameAddress(input.token, tokenIn) ||
        // ERC20 的 amountIn=0 会使用合约余额，无法仅凭 calldata 确定转移量。
        (!nativeInput && input.amountIn.isZero())
    )
  ) {
    return null;
  }

  // 原生币输入项的 amountIn 不参与合约转账；实际支付金额是 msg.value。
  // ERC20 需要累计所有分流和手续费项，不能只读取第一项。
  const amountIn = nativeInput
    ? new BigNumber(txValue)
    : inputTokens.reduce(
        (total, input) => total.plus(input.amountIn.toString()),
        new BigNumber(0)
      );
  const { token, recipient, amountOutMin } = outputTokens[0];

  return {
    fromToken: normalizeEeeeToken(tokenIn, nativeTokenAddress),
    fromTokenAmount: amountIn.toFixed(0),
    toToken: normalizeEeeeToken(token, nativeTokenAddress),
    minReceiveToTokenAmount: amountOutMin.toString(),
    toTokenReceiver: recipient,
  };
};

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = getChainById(tx.chainId);
  if (!chain) return null;

  const contractInterface = new Interface(SushiABI);
  const result = contractInterface.parseTransaction({ data: tx.data });
  switch (result.name) {
    case "snwap":
      return decodeSnwap(result.args, chain.nativeTokenAddress, tx.value);
    case "snwapMultiple":
      return decodeSnwapMultiple(result.args, chain.nativeTokenAddress, tx.value);
    default:
      return null;
  }
};
