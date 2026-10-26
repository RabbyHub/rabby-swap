/**
 * 当前接入 0x API v2 的两层调用，selector 分开解析：
 *
 * 1. AllowanceHolder.exec，selector：0x2213bc0b。
 *    参数：(address operator, address token, uint256 amount, address payable target, bytes data)。
 *    场景：用户把支付授权交给 AllowanceHolder，由它代为调用 Settler；支付币和数量取自这里。
 *    支付币用零地址表示原生币。
 *    官方接口：https://github.com/0xProject/0x-settler/blob/master/src/allowanceholder/IAllowanceHolder.sol
 *    部署地址：https://etherscan.io/address/0x0000000000001ff3684f28c67538d4d072c22734#code
 *
 * 2. Settler.execute，selector：0x1fff991f。
 *    参数：(AllowedSlippage slippage, bytes[] actions, bytes32 zidAndAffiliate)。
 *    AllowedSlippage = (address recipient, address buyToken, uint256 minAmountOut)。
 *    场景：Settler 执行聚合动作；输出币、最低到账和收款地址取自 slippage。
 *    输出币用 0xEeee… 表示原生币。
 *    官方接口：https://github.com/0xProject/0x-settler/blob/master/src/interfaces/ISettlerTakerSubmitted.sol
 *    slippage 定义：https://github.com/0xProject/0x-settler/blob/master/src/interfaces/ISettlerBase.sol
 *
 * 现有报价都是 exec 包裹 execute。单独的 execute 没有顶层支付数量，不在当前解析范围。
 * 校验限制：operator 与 target 一致；实际原生币支付量需匹配输入。
 */
import { CHAINS_ENUM } from "@debank/common";
import { Interface } from "@ethersproject/abi";
import type { Result } from "@ethersproject/abi";
import BigNumber from "bignumber.js";
import { getChainById } from "../chain";
import type { TxWithChainId, DecodeCalldataResult } from "../calldata/types";
import {
  generateGetQuote,
  isSameAddress,
  NULL_ADDRESS,
  normalizeEeeeToken,
  normalizeZeroAddressToken,
} from "../utils";
import { ZeroXABIV2 } from "../abi";
import { DEX_ENUM } from "../consts";

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.BASE,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.AVAX,
  "BERA" as CHAINS_ENUM,
  "UNI" as CHAINS_ENUM,
  CHAINS_ENUM.SCRL,
  "PLASMA" as CHAINS_ENUM,
  "MONAD" as CHAINS_ENUM,
  "HYPER" as CHAINS_ENUM,
  "HOOD" as CHAINS_ENUM,
  "ARC" as CHAINS_ENUM,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "matcha_v2",
  dex: DEX_ENUM.ZEROXAPIV2,
});

const decodeSettlerExecute = (
  data: string,
  nativeTokenAddress: string,
  contractInterface: Interface
): Pick<
  DecodeCalldataResult,
  "toToken" | "minReceiveToTokenAmount" | "toTokenReceiver"
> | null => {
  let result;
  try {
    result = contractInterface.parseTransaction({ data });
  } catch {
    return null;
  }
  if (result.name !== "execute") return null;

  const { recipient, buyToken, minAmountOut } = result.args.slippage;
  if (!recipient || !buyToken || minAmountOut == null) return null;

  return {
    toToken: normalizeEeeeToken(buyToken, nativeTokenAddress),
    minReceiveToTokenAmount: minAmountOut.toString(),
    toTokenReceiver: recipient,
  };
};

const decodeAllowanceHolderExec = (
  args: Result,
  nativeTokenAddress: string,
  contractInterface: Interface,
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const { operator, token, amount, target, data } = args;
  if (token == null || amount == null || typeof data !== "string" || !data) {
    return null;
  }

  // 扣款方需与实际执行方一致。
  if (!isSameAddress(operator, target)) return null;

  // exec 会将 msg.value 转给 target；实际支付原生币的数量必须与输入一致。
  const expectedValue = isSameAddress(token, NULL_ADDRESS)
    ? amount.toString()
    : "0";
  if (!new BigNumber(tx.value).eq(expectedValue)) return null;

  const output = decodeSettlerExecute(data, nativeTokenAddress, contractInterface);
  if (!output) return null;

  return {
    fromToken: normalizeZeroAddressToken(token, nativeTokenAddress),
    fromTokenAmount: amount.toString(),
    ...output,
  };
};

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = getChainById(tx.chainId);
  if (!chain) return null;

  const contractInterface = new Interface(ZeroXABIV2);
  const result = contractInterface.parseTransaction({ data: tx.data });
  switch (result.name) {
    case "exec":
      return decodeAllowanceHolderExec(
        result.args,
        chain.nativeTokenAddress,
        contractInterface,
        tx
      );
    default:
      return null;
  }
};
