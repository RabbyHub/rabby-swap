import { DEX_ENUM } from "../consts";
import type { DecodeCalldataResult, TxWithChainId } from "../calldata/types";
import { decodeCalldata } from "../quote";

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
