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

/** 比对失败的稳定原因码。不含地址、金额或 calldata。 */
export type SwapCalldataMismatch =
  | "missing_dex"
  | "missing_tx"
  | "missing_quote"
  | "not_decoded"
  | "fee_adjustment"
  | "from_token"
  | "from_amount"
  | "to_token"
  | "min_receive"
  | "non_positive_minimum";

/** 最低到账须为正。允许等于滑点下限的向下取整，或相对偏差不超过 5%。 */
const minReceiveMatches = (
  minReceive: BigNumber,
  minimum: BigNumber
) =>
  minReceive.gt(0) &&
  minimum.gt(0) &&
  (minReceive.eq(minimum.integerValue(BigNumber.ROUND_FLOOR)) ||
    minReceive.minus(minimum).div(minimum).abs().lte(CALLDATA_MIN_RECEIVE_TOLERANCE));

const mismatchReasons = (
  decoded: DecodeCalldataResult,
  quote: QuoteResult,
  slippageRatio: string | number,
  requirePositiveMinimum = false
): SwapCalldataMismatch[] => {
  const minimum = new BigNumber(quote.toTokenAmount).times(
    new BigNumber(1).minus(slippageRatio)
  );
  const reasons: SwapCalldataMismatch[] = [];
  if (requirePositiveMinimum && !minimum.gt(0)) {
    reasons.push("non_positive_minimum");
  }
  if (!isSameAddress(decoded.fromToken, quote.fromToken)) {
    reasons.push("from_token");
  }
  if (decoded.fromTokenAmount !== quote.fromTokenAmount) {
    reasons.push("from_amount");
  }
  if (!isSameAddress(decoded.toToken, quote.toToken)) {
    reasons.push("to_token");
  }
  if (!minReceiveMatches(new BigNumber(decoded.minReceiveToTokenAmount), minimum)) {
    reasons.push("min_receive");
  }
  return reasons;
};

/** token、支付数量、最低到手比对；收款地址由 receiver 模块校验。 */
export const matchDecodedCalldata = (
  decoded: DecodeCalldataResult,
  quote: QuoteResult,
  slippageRatio: string | number,
  requirePositiveMinimum = false
) => {
  return mismatchReasons(decoded, quote, slippageRatio, requirePositiveMinimum)
    .length === 0;
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

/** 失败原因只含稳定码，供上报使用。通过时返回空数组。 */
export const calldataMismatchReasons = (
  p: VerifyCalldataParams
): SwapCalldataMismatch[] => {
  if (!p.dexId) return ["missing_dex"];
  if (!p.tx) return ["missing_tx"];
  if (!p.data) return ["missing_quote"];
  // Wrap 由 SDK 本地构造，沿用独立流程；普通 DEX 必须成功解析后才能校验。
  if (p.dexId === DEX_ENUM.WRAPTOKEN) return [];
  const decoded =
    p.decoded !== undefined
      ? p.decoded
      : decodeSwapCalldata(p.dexId, p.tx);
  if (!decoded) return ["not_decoded"];
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
      return ["fee_adjustment"];
    }
    return mismatchReasons(
      { ...decoded, fromTokenAmount: inputAmount },
      { ...p.data, fromTokenAmount: requestedAmount },
      p.slippage,
      true
    );
  }
  if (shouldSkipCalldataMatch(p.slippage, decoded, p.data, p.tx)) return [];
  if (p.dexId === DEX_ENUM.ONEINCH && p.tx.chainId === ARC_CHAIN_ID) {
    const requestedAmount = getComparableNativeInputAmount(
      p.data.fromTokenAmount,
      decoded,
      p.tx.chainId,
      getNativeTokenAddress(p.tx.chainId)
    );
    return mismatchReasons(
      decoded,
      { ...p.data, fromTokenAmount: requestedAmount },
      p.slippage
    );
  }
  return mismatchReasons(decoded, p.data, p.slippage);
};

export const verifyCalldata = (p: VerifyCalldataParams) =>
  calldataMismatchReasons(p).length === 0;
