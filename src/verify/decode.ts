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
  /** 稳定原因码。不含报错原文、地址、金额或 calldata。 */
  detail?: string;
};

const DECODE_DETAILS: [string, string][] = [
  ["Unsupported Magpie calldata selector", "unsupported_selector"],
  ["Automatic ERC20 input", "automatic_erc20_input"],
  ["Original input amount is zero", "zero_input"],
  ["Native transaction value does not equal", "native_value_mismatch"],
  ["Multiple output assets", "multiple_outputs"],
  ["Multiple user-funded input assets", "multiple_inputs"],
  ["Additional user-funded debit", "locked_input"],
  ["Incomplete swap data", "incomplete_swap"],
  ["The route does not describe a swap", "same_asset"],
  ["Cannot determine the original input amount", "dynamic_input"],
  ["Unsupported command", "unsupported_command"],
  ["Unsupported V4 action", "unsupported_v4_action"],
  ["Commands and inputs lengths differ", "command_length"],
  ["Sub-plans with allow-revert", "allow_revert_subplan"],
  ["Router 1.2 command", "legacy_seaport"],
  ["Swap path requires at least two tokens", "short_path"],
  ["V4 actions and params lengths differ", "v4_length"],
  ["V4 swap path is empty", "empty_v4_path"],
  ["V4 returns the original input asset", "v4_input_refund"],
  ["OPEN_DELTA input", "open_delta"],
  ["Invalid payment portion", "invalid_fee_portion"],
  ["WRAP_ETH to an external recipient", "external_wrap"],
  ["Invalid V2 token address", "invalid_v2_token"],
  ["V2 pair requires two distinct tokens", "invalid_v2_pair"],
  ["Non-input-asset Magpie fees", "magpie_fee_asset"],
  ["Packed field points outside", "magpie_payload_bounds"],
  ["Unknown Universal Router", "unknown_router"],
  ["Native token is not configured", "missing_native"],
];

/** 只保留原因码。报错原文可能带上 selector 以外的动态内容，不能上报。 */
export const classifyDecodeDetail = (message: unknown): string => {
  if (typeof message !== "string" || !message) return "unclassified";
  const known = DECODE_DETAILS.find(([prefix]) => message.startsWith(prefix));
  return known ? known[1] : "unclassified";
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
    const detail = classifyDecodeDetail(decodeError?.message);
    const unsupportedSelector =
      !!selector &&
      (decodeError?.reason === "no matching function" ||
        detail === "unsupported_selector");
    return {
      decoded: null,
      decodeFailure: {
        reason: unsupportedSelector ? "unsupported_selector" : "decode_error",
        selector,
        errorCode:
          typeof decodeError?.code === "string"
            ? decodeError.code
            : "UNKNOWN_ERROR",
        detail: unsupportedSelector ? "unsupported_selector" : detail,
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
