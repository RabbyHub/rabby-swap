import BigNumber from "bignumber.js";
import { CHAINS_ENUM } from "@debank/common";
import { DEX_ENUM } from "../consts";
import type { DecodeCalldataResult, TxWithChainId } from "../calldata/types";
import type { QuoteResult } from "../quote";
import { calldataMismatchReasons } from "./calldata";
import type { SwapCalldataMismatch } from "./calldata";
import { decodeSwapCalldataWithDiagnostics } from "./decode";
import type { SwapCalldataDecodeFailure } from "./decode";
import { verifyRouterAndSpender } from "./contracts";
import { isSwapCalldataReceiverAllowed } from "./receiver";
import { isSwapWrapToken } from "./wrap";
import { getChainById } from "../chain";

export type VerifySdkParams = {
  chain: CHAINS_ENUM;
  dexId: DEX_ENUM;
  /** UI 滑点，单位百分数，如 1 表示 1%。 */
  slippage: string | number;
  data: QuoteResult | null;
  payTokenId: string;
  receiveTokenId: string;
  /** 链目录未收录时，使用应用传入的 native 标识。 */
  nativeTokenAddress: string;
  /** 解码 calldata 用；应用侧用自己的链目录解析。 */
  chainId: number;
  userAddress: string;
};

export type VerifySdkResult = {
  routerPass: boolean;
  spenderPass: boolean;
  callDataPass: boolean;
  receiverPass: boolean;
  isSdkDataPass: boolean;
  decoded: DecodeCalldataResult | null;
  /** 普通 DEX 解析失败时，callDataPass 和 isSdkDataPass 均为 false。 */
  decodeFailure?: SwapCalldataDecodeFailure;
  /** 解析成功但字段比对失败时的原因码。不含地址、金额或 calldata。 */
  calldataMismatch?: SwapCalldataMismatch[];
};

const toTxWithChainId = (
  data: QuoteResult | null,
  chainId: number
): TxWithChainId | undefined =>
  data?.tx ? { ...data.tx, chainId } : undefined;

/**
 * 统一入口：合约地址校验 → calldata 解析 → 解析结果校验 → 收款人校验。
 * native↔WETH 视为 wrap，走 WRAPTOKEN（不解码、不查 DEX 白名单）。
 * 预执行、gas 不在此处理。
 */
export const verifySdk = (p: VerifySdkParams): VerifySdkResult => {
  const nativeTokenAddress =
    getChainById(p.chainId)?.nativeTokenAddress ?? p.nativeTokenAddress;
  const actualDexId = isSwapWrapToken(
    p.payTokenId,
    p.receiveTokenId,
    p.chain,
    nativeTokenAddress
  )
    ? DEX_ENUM.WRAPTOKEN
    : p.dexId;

  // 1. Router / Spender 地址校验（contracts.ts）。
  const [routerPass, spenderPass] = verifyRouterAndSpender({
    chain: p.chain,
    dexId: actualDexId,
    router: p.data?.tx?.to,
    spender: p.data?.spender,
    payTokenId: p.payTokenId,
    receiveTokenId: p.receiveTokenId,
    nativeTokenAddress,
  });

  const tx = toTxWithChainId(p.data, p.chainId);
  const slippageRatio = new BigNumber(p.slippage).div(100).toFixed();
  // 2. Calldata 解析及失败诊断（decode.ts）。
  const { decoded, decodeFailure } = decodeSwapCalldataWithDiagnostics(
    actualDexId,
    tx
  );
  // 3. 解析结果与报价的币对、金额、最低到账量比较（calldata.ts）。
  const calldataParams = {
    data: p.data,
    dexId: actualDexId,
    slippage: slippageRatio,
    tx,
    decoded,
  };
  const calldataMismatch = calldataMismatchReasons(calldataParams);
  const callDataPass = calldataMismatch.length === 0;
  // 4. Receiver 收款地址校验（receiver.ts）。
  const receiverPass = isSwapCalldataReceiverAllowed(
    decoded?.toTokenReceiver,
    p.userAddress
  );

  return {
    routerPass,
    spenderPass,
    callDataPass,
    receiverPass,
    isSdkDataPass: routerPass && spenderPass && callDataPass && receiverPass,
    decoded,
    decodeFailure,
    calldataMismatch: callDataPass ? undefined : calldataMismatch,
  };
};
