import BigNumber from "bignumber.js";
import { CHAINS_ENUM } from "@debank/common";
import { DEX_ENUM } from "../consts";
import {
  DecodeCalldataResult,
  QuoteResult,
  TxWithChainId,
} from "../quote";
import { decodeSwapCalldata, verifyCalldata } from "./calldata";
import { verifyRouterAndSpender } from "./contracts";
import { isSwapCalldataReceiverAllowed } from "./receiver";
import { isSwapWrapToken } from "./wrap";

export type VerifySdkParams = {
  chain: CHAINS_ENUM;
  dexId: DEX_ENUM;
  /** UI 滑点，单位百分数，如 1 表示 1%。 */
  slippage: string | number;
  data: QuoteResult | null;
  payTokenId: string;
  receiveTokenId: string;
  /** 由应用传入，对应其链目录中的 native 地址。 */
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
};

const toTxWithChainId = (
  data: QuoteResult | null,
  chainId: number
): TxWithChainId | undefined =>
  data?.tx ? { ...data.tx, chainId } : undefined;

/**
 * 组合 router / spender / calldata。
 * native↔WETH 视为 wrap，走 WRAPTOKEN（不解码、不查 DEX 白名单）。
 * 预执行、gas 不在此处理。
 */
export const verifySdk = (p: VerifySdkParams): VerifySdkResult => {
  const actualDexId = isSwapWrapToken(
    p.payTokenId,
    p.receiveTokenId,
    p.chain,
    p.nativeTokenAddress
  )
    ? DEX_ENUM.WRAPTOKEN
    : p.dexId;

  const [routerPass, spenderPass] = verifyRouterAndSpender({
    chain: p.chain,
    dexId: actualDexId,
    router: p.data?.tx?.to,
    spender: p.data?.spender,
    payTokenId: p.payTokenId,
    receiveTokenId: p.receiveTokenId,
    nativeTokenAddress: p.nativeTokenAddress,
  });

  const tx = toTxWithChainId(p.data, p.chainId);
  const slippageRatio = new BigNumber(p.slippage).div(100).toFixed();
  const decoded = decodeSwapCalldata(actualDexId, tx);
  const callDataPass = verifyCalldata({
    data: p.data,
    dexId: actualDexId,
    slippage: slippageRatio,
    tx,
    decoded,
  });
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
  };
};
