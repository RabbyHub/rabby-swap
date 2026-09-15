/**
 * Swap 两端共用的报价校验。
 * wrap / 合约白名单 / calldata 比对分文件；收款人、链目录、预执行留在应用。
 */
export { isSwapWrapToken } from "./wrap";
export { getRouter, getSpender, verifyRouterAndSpender } from "./contracts";
export type { VerifyRouterAndSpenderParams } from "./contracts";
export {
  CALLDATA_MIN_RECEIVE_TOLERANCE,
  decodeSwapCalldata,
  matchDecodedCalldata,
  shouldSkipCalldataMatch,
  verifyCalldata,
} from "./calldata";
export type { VerifyCalldataParams } from "./calldata";
export { verifySdk } from "./sdk";
export type { VerifySdkParams, VerifySdkResult } from "./sdk";
