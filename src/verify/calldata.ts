import BigNumber from "bignumber.js";
import { ARC_CHAIN_ID, DEX_ENUM } from "../consts";
import { getNativeTokenAddress } from "../chain";
import { decodeInputFee } from "../calldata/magpie";
import type { DecodeCalldataResult, TxWithChainId } from "../calldata/types";
import type { QuoteResult } from "../quote";
import { decodeSwapCalldata } from "./decode";
import { getComparableNativeInputAmount, isSameAddress } from "../utils";

/** 解码出的 minReceive 相对「报价 × (1-滑点)」允许的相对偏差。 */
export const CALLDATA_MIN_RECEIVE_TOLERANCE = 0.05;

/** token、支付数量、最低到手比对；收款地址由 receiver 模块校验。 */
export const matchDecodedCalldata = (
  decoded: DecodeCalldataResult,
  quote: QuoteResult,
  slippageRatio: string | number,
  requirePositiveMinimum = false
) => {
  const minimum = new BigNumber(quote.toTokenAmount).times(
    new BigNumber(1).minus(slippageRatio)
  );
  return (
    (!requirePositiveMinimum || minimum.gt(0)) &&
    isSameAddress(decoded.fromToken, quote.fromToken) &&
    decoded.fromTokenAmount === quote.fromTokenAmount &&
    isSameAddress(decoded.toToken, quote.toToken) &&
    new BigNumber(decoded.minReceiveToTokenAmount)
      .minus(minimum)
      .div(minimum)
      .abs()
      .lte(CALLDATA_MIN_RECEIVE_TOLERANCE)
  );
};

export type VerifyCalldataParams = {
  data: QuoteResult | null;
  dexId: DEX_ENUM | null;
  /** 已换算成小数的滑点，如 1% → 0.01。 */
  slippage: string | number;
  tx?: TxWithChainId;
  decoded?: DecodeCalldataResult | null;
};

/** 其他 DEX 沿用的跳过策略；Uni/Magpie 必须完成字段校验。 */
export const shouldSkipCalldataMatch = (
  slippage: string | number,
  decoded: DecodeCalldataResult | null,
  data: QuoteResult | null,
  tx?: TxWithChainId
) => !slippage || !decoded || !data || !tx;

export const verifyCalldata = (p: VerifyCalldataParams) => {
  if (!p.dexId || !p.tx || !p.data) return false;
  // Wrap 由 SDK 本地构造，沿用独立流程；普通 DEX 必须成功解析后才能校验。
  if (p.dexId === DEX_ENUM.WRAPTOKEN) return true;
  const decoded =
    p.decoded !== undefined
      ? p.decoded
      : decodeSwapCalldata(p.dexId, p.tx);
  if (!decoded) return false;
  if (p.dexId === DEX_ENUM.UNI || p.dexId === DEX_ENUM.MAGPIE) {
    let requestedAmount = p.data.fromTokenAmount;
    let inputAmount = decoded.fromTokenAmount;
    try {
      if (p.dexId === DEX_ENUM.MAGPIE) {
        // Encoded input-asset fees are transferred separately from amountIn.
        inputAmount = new BigNumber(inputAmount)
          .plus(decodeInputFee(p.tx, decoded))
          .toFixed(0);
      } else {
        requestedAmount = getComparableNativeInputAmount(
          requestedAmount,
          decoded,
          p.tx.chainId,
          getNativeTokenAddress(p.tx.chainId)
        );
      }
    } catch {
      return false;
    }
    return matchDecodedCalldata(
      { ...decoded, fromTokenAmount: inputAmount },
      { ...p.data, fromTokenAmount: requestedAmount },
      p.slippage,
      true
    );
  }
  if (shouldSkipCalldataMatch(p.slippage, decoded, p.data, p.tx)) return true;
  if (p.dexId === DEX_ENUM.ONEINCH && p.tx!.chainId === ARC_CHAIN_ID) {
    const requestedAmount = getComparableNativeInputAmount(
      p.data!.fromTokenAmount,
      decoded!,
      p.tx!.chainId,
      getNativeTokenAddress(p.tx!.chainId)
    );
    return matchDecodedCalldata(
      decoded!,
      { ...p.data!, fromTokenAmount: requestedAmount },
      p.slippage
    );
  }
  return matchDecodedCalldata(decoded!, p.data!, p.slippage);
};
