/**
 * 解析 AllowanceHolder.exec → Settler.execute，不支持独立 execute。
 * 支付币和数量取自 exec；输出约束取自 slippage，空值时读取支持的末尾 action。
 * 原生币标记：输入为零地址，输出为 0xEeee…。
 * 仅支持 operator == target 且附带原生币数量匹配的路线；内层合约身份仍需校验。
 * 接口：https://github.com/0xProject/0x-settler/blob/master/src/allowanceholder/IAllowanceHolder.sol
 * https://github.com/0xProject/0x-settler/blob/master/src/interfaces/ISettlerTakerSubmitted.sol
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
import { isAddress } from "web3-utils";
import { ZeroXABIV2 } from "../abi";
import { DEX_ENUM } from "../consts";
import { FEW_ROUTER_CONFIG, ZEROX_V2_POOLS } from "./0xapi_v2.config";

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
  "INK" as CHAINS_ENUM,
  CHAINS_ENUM.LINEA,
  CHAINS_ENUM.MANTLE,
  "SONIC" as CHAINS_ENUM,
  "ELYSIUM" as CHAINS_ENUM,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "matcha_v2",
  dex: DEX_ENUM.ZEROXAPIV2,
});

const terminalSwapInterface = new Interface([
  "function UNISWAPV3(address recipient,uint256 ppm,bytes path,uint256 amountOutMin)",
  "function UNISWAPV2(address recipient,address sellToken,uint256 ppm,address pool,uint24 swapInfo,uint256 amountOutMin)",
  "function BEBOP(address recipient,address sellToken,(uint256 expiry,address maker_address,uint256 maker_nonce,address maker_token,uint256 taker_amount,uint256 maker_amount,uint256 event_id_and_flags) order,(bytes signatureBytes,uint256 flags) makerSignature,uint256 amountOutMin)",
  "function BASIC(address sellToken,uint256 ppm,address pool,uint256 offset,bytes data)",
]);
const fewRouterInterface = new Interface([
  "function swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)",
]);

const decodeTerminalSwap = (
  actions: string[],
  nativeTokenAddress: string,
  chainId: number
) => {
  if (!actions.length) return null;
  let swap;
  try {
    swap = terminalSwapInterface.parseTransaction({
      data: actions[actions.length - 1],
    });
  } catch {
    return null;
  }
  let { recipient, amountOutMin } = swap.args;
  const { ppm } = swap.args;
  // V2 的 ppm=0 表示上一跳已直接向池子付款。
  if (ppm && (ppm.gt(1000000) || (ppm.isZero() && swap.name !== "UNISWAPV2")))
    return null;
  let output: string;
  switch (swap.name) {
    case "UNISWAPV3": {
      // Path = input(20) + n * [forkId(1), poolId(3), sqrtLimit(20), output(20)].
      const { path } = swap.args;
      const length = (path.length - 2) / 2;
      if (length < 64 || (length - 20) % 44 !== 0) return null;
      output = `0x${path.slice(-40)}`;
      break;
    }
    case "BEBOP": {
      // sellToBebop enforces amountOutMin even for partial fills, then pays recipient.
      // https://github.com/0xProject/0x-settler/blob/master/src/core/Bebop.sol
      const { order } = swap.args;
      // shortcut: ERC20 orders only; native payout flags need separate asset normalization.
      if (
        !order.event_id_and_flags.shr(248).isZero() ||
        order.taker_amount.isZero()
      )
        return null;
      output = order.maker_token;
      break;
    }
    case "UNISWAPV2": {
      const { pool, sellToken, swapInfo } = swap.args;
      const tokens = ZEROX_V2_POOLS[chainId]?.[pool.toLowerCase()];
      if (!tokens || (swapInfo & 0xfc) !== 0 || swapInfo >> 8 >= 10000)
        return null;
      const inputIndex = swapInfo & 1 ? 0 : 1;
      if (!isSameAddress(sellToken, tokens[inputIndex])) return null;
      output = tokens[1 - inputIndex];
      break;
    }
    case "BASIC": {
      const { pool, offset, sellToken, data } = swap.args;
      // BASIC overwrites a calldata word; only the amountIn word may change here.
      if (
        chainId !== FEW_ROUTER_CONFIG.chainId ||
        !isSameAddress(pool, FEW_ROUTER_CONFIG.address) ||
        !offset.eq(4)
      )
        return null;
      let inner;
      try {
        inner = fewRouterInterface.parseTransaction({ data });
      } catch {
        return null;
      }
      const { path, to } = inner.args;
      if (
        path.length < 2 ||
        !isSameAddress(
          FEW_ROUTER_CONFIG.tokens[path[0].toLowerCase()] || "",
          sellToken
        )
      )
        return null;
      // Few Router unwrapTo pays the underlying token 1:1, not the path's wrapper.
      output = FEW_ROUTER_CONFIG.tokens[path[path.length - 1].toLowerCase()];
      if (!output) return null;
      recipient = to;
      amountOutMin = inner.args.amountOutMin;
      break;
    }
    default:
      return null;
  }
  if (
    amountOutMin.isZero() ||
    !isAddress(recipient) ||
    isSameAddress(recipient, NULL_ADDRESS) ||
    !isAddress(output) ||
    isSameAddress(output, NULL_ADDRESS)
  )
    return null;
  return {
    toToken: normalizeEeeeToken(output, nativeTokenAddress),
    minReceiveToTokenAmount: amountOutMin.toString(),
    toTokenReceiver: recipient,
  };
};

const decodeSettlerExecute = (
  data: string,
  nativeTokenAddress: string,
  contractInterface: Interface,
  chainId: number
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

  // Settler skips the final transfer/check when both fields are zero.
  // https://github.com/0xProject/0x-settler/blob/master/src/SettlerBase.sol#L88-L111
  if (isSameAddress(buyToken, NULL_ADDRESS) && minAmountOut.isZero()) {
    return decodeTerminalSwap(result.args.actions, nativeTokenAddress, chainId);
  }
  if (
    isSameAddress(recipient, NULL_ADDRESS) ||
    isSameAddress(buyToken, NULL_ADDRESS)
  )
    return null;

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

  // 扣款与执行须由同一 Settler 完成。
  if (!isSameAddress(operator, target)) return null;

  // 原生币 amount 须匹配 value；ERC20 的 value 须为零。
  const expectedValue = isSameAddress(token, NULL_ADDRESS)
    ? amount.toString()
    : "0";
  if (!new BigNumber(tx.value).eq(expectedValue)) return null;

  const output = decodeSettlerExecute(
    data,
    nativeTokenAddress,
    contractInterface,
    tx.chainId
  );
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
