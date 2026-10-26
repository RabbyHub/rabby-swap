/**
 * Swap 两端共用的报价校验。
 * wrap / 合约白名单 / calldata 分文件；链目录、预执行留在应用。
 */
export { isSwapWrapToken } from "./wrap";
export { getRouter, getSpender, verifyRouterAndSpender } from "./contracts";
export type { VerifyRouterAndSpenderParams } from "./contracts";
export {
  decodeSwapCalldata,
  decodeSwapCalldataWithDiagnostics,
} from "./decode";
export type {
  SwapCalldataDecodeFailure,
  SwapCalldataDecodeResult,
} from "./decode";
export {
  CALLDATA_MIN_RECEIVE_TOLERANCE,
  matchDecodedCalldata,
  shouldSkipCalldataMatch,
  verifyCalldata,
} from "./calldata";
export type { VerifyCalldataParams } from "./calldata";
export { isSwapCalldataReceiverAllowed } from "./receiver";
export { verifySdk } from "./sdk";
export type { VerifySdkParams, VerifySdkResult } from "./sdk";
