import BigNumber from "bignumber.js";
import { DEX_ENUM } from "../consts";
import {
  DecodeCalldataResult,
  QuoteResult,
  TxWithChainId,
  decodeCalldata,
} from "../quote";
import { isSameAddress } from "../utils";

/** 解码出的 minReceive 相对「报价 × (1-滑点)」允许的相对偏差。两端现网均为 5%。 */
export const CALLDATA_MIN_RECEIVE_TOLERANCE = 0.05;

/**
 * 尝试解码。wrap、无 dex、无 tx、解码抛错或解不出时返回 null。
 */
export const decodeSwapCalldata = (
  dexId: DEX_ENUM | null,
  tx?: TxWithChainId
): DecodeCalldataResult | null => {
  if (!dexId || dexId === DEX_ENUM.WRAPTOKEN || !tx) {
    return null;
  }
  try {
    return decodeCalldata(dexId, tx);
  } catch {
    return null;
  }
};

/** 纯比对：token、支付数量、最低到手（相对滑点带）。 */
export const matchDecodedCalldata = (
  decoded: DecodeCalldataResult,
  quote: QuoteResult,
  slippageRatio: string | number
) => {
  const estimateMinReceive = new BigNumber(quote.toTokenAmount).times(
    new BigNumber(1).minus(slippageRatio)
  );
  return (
    isSameAddress(decoded.fromToken, quote.fromToken) &&
    decoded.fromTokenAmount === quote.fromTokenAmount &&
    isSameAddress(decoded.toToken, quote.toToken) &&
    new BigNumber(decoded.minReceiveToTokenAmount)
      .minus(estimateMinReceive)
      .div(estimateMinReceive)
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
  /** 传入则不再解码。 */
  decoded?: DecodeCalldataResult | null;
};

/** 解不出、无滑点或无报价时跳过比对（现网视为通过）。 */
export const shouldSkipCalldataMatch = (
  slippage: string | number,
  decoded: DecodeCalldataResult | null,
  data: QuoteResult | null,
  tx?: TxWithChainId
) => !slippage || !decoded || !data || !tx;

/**
 * 解码并与报价比对。解码成功后不再依赖应用链目录。
 */
export const verifyCalldata = (p: VerifyCalldataParams) => {
  const decoded =
    p.decoded !== undefined ? p.decoded : decodeSwapCalldata(p.dexId, p.tx);
  if (shouldSkipCalldataMatch(p.slippage, decoded, p.data, p.tx)) {
    return true;
  }
  return matchDecodedCalldata(decoded!, p.data!, p.slippage);
};
