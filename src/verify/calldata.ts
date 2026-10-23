import BigNumber from "bignumber.js";
import { ARC_CHAIN_ID, DEX_ENUM } from "../consts";
import { getNativeTokenAddress } from "../chain";
import { decodeInputFee } from "../calldata/magpie";
import type { DecodeCalldataResult, TxWithChainId } from "../calldata/types";
import type { QuoteResult } from "../quote";
import { decodeCalldata } from "../quote";
import { getComparableNativeInputAmount, isSameAddress } from "../utils";

/** 解码出的 minReceive 相对「报价 × (1-滑点)」允许的相对偏差。 */
export const CALLDATA_MIN_RECEIVE_TOLERANCE = 0.05;

/**
 * unsupported_selector: the top-level function is not supported by the parser.
 * decode_error: decoding threw; the input or parser needs investigation.
 * returned_null: the decoder returned no fields without throwing.
 * Diagnostic only: never attach raw errors or transaction data.
 */
export type SwapCalldataDecodeFailure = {
  reason: "unsupported_selector" | "decode_error" | "returned_null";
  selector?: string;
  errorCode?: string;
};

export type SwapCalldataDecodeResult = {
  decoded: DecodeCalldataResult | null;
  decodeFailure?: SwapCalldataDecodeFailure;
};

/** Preserve decode failures separately from the existing verification policy. */
export const decodeSwapCalldataWithDiagnostics = (
  dexId: DEX_ENUM | null,
  tx?: TxWithChainId
): SwapCalldataDecodeResult => {
  if (!dexId || dexId === DEX_ENUM.WRAPTOKEN || !tx) return { decoded: null };
  const selector =
    typeof tx.data === "string" && /^0x[0-9a-f]{8}/i.test(tx.data)
      ? tx.data.slice(0, 10).toLowerCase()
      : undefined;
  try {
    const decoded = decodeCalldata(dexId, tx);
    return decoded
      ? { decoded }
      : { decoded, decodeFailure: { reason: "returned_null", selector } };
  } catch (error) {
    const decodeError = error as {
      code?: unknown;
      reason?: unknown;
      message?: unknown;
    } | null | undefined;
    const unsupportedSelector =
      !!selector &&
      (decodeError?.reason === "no matching function" ||
        decodeError?.message === `Unsupported Magpie calldata selector: ${selector}`);
    return {
      decoded: null,
      decodeFailure: {
        reason: unsupportedSelector ? "unsupported_selector" : "decode_error",
        selector,
        errorCode:
          typeof decodeError?.code === "string"
            ? decodeError.code
            : "UNKNOWN_ERROR",
      },
    };
  }
};

/** wrap、无 dex、无 tx、解码失败时返回 null，保持原有接口。 */
export const decodeSwapCalldata = (
  dexId: DEX_ENUM | null,
  tx?: TxWithChainId
): DecodeCalldataResult | null =>
  decodeSwapCalldataWithDiagnostics(dexId, tx).decoded;

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
  const decoded =
    p.decoded !== undefined
      ? p.decoded
      : decodeSwapCalldata(p.dexId, p.tx);
  if (p.dexId === DEX_ENUM.UNI || p.dexId === DEX_ENUM.MAGPIE) {
    if (!p.tx || !decoded || !p.data) return false;
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
