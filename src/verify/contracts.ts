import { CHAINS_ENUM } from "@debank/common";
import { ARC_ERC20_USDC, DEX_ENUM } from "../consts";
import { UNI_NATIVE_TO_ADDRESSES } from "../dexs/uni";
import { DEX_ROUTER_WHITELIST, DEX_SPENDER_WHITELIST } from "../list";
import { isSameAddress } from "../utils";
import { isSwapWrapToken } from "./wrap";

type RouterDexId = keyof typeof DEX_ROUTER_WHITELIST;
type SpenderDexId = keyof typeof DEX_SPENDER_WHITELIST;

const isNativeToken = (tokenId: string, nativeTokenAddress: string) =>
  isSameAddress(tokenId, nativeTokenAddress);

/** Uni 的 native 输入（含 Arc ERC20 USDC）直接走 Universal Router，其余走 proxy。 */
export const getRouter = (
  dexId: DEX_ENUM,
  chain: CHAINS_ENUM,
  payTokenId: string,
  nativeTokenAddress: string
) => {
  if (
    dexId === DEX_ENUM.UNI &&
    (isNativeToken(payTokenId, nativeTokenAddress) ||
      (chain === ("ARC" as CHAINS_ENUM) &&
        isSameAddress(payTokenId, ARC_ERC20_USDC)))
  ) {
    return UNI_NATIVE_TO_ADDRESSES[chain];
  }
  const list = DEX_ROUTER_WHITELIST[dexId as RouterDexId];
  if (!list) return undefined;
  return list[chain as keyof typeof list];
};

/** wrap 无 spender；其余读白名单。 */
export const getSpender = (dexId: DEX_ENUM, chain: CHAINS_ENUM) => {
  if (dexId === DEX_ENUM.WRAPTOKEN) {
    return "";
  }
  const list = DEX_SPENDER_WHITELIST[dexId as SpenderDexId];
  if (!list) return undefined;
  return list[chain as keyof typeof list];
};

export type VerifyRouterAndSpenderParams = {
  chain: CHAINS_ENUM;
  dexId: DEX_ENUM;
  router?: string;
  spender?: string;
  payTokenId?: string;
  receiveTokenId?: string;
  nativeTokenAddress: string;
};

/**
 * 校验 tx.to / approve spender 是否在白名单。
 * wrap、native 支付或缺少 spender 时跳过 spender 校验。
 */
export const verifyRouterAndSpender = (
  p: VerifyRouterAndSpenderParams
): [boolean, boolean] => {
  const {
    chain,
    dexId,
    router,
    spender,
    payTokenId,
    receiveTokenId,
    nativeTokenAddress,
  } = p;

  if (dexId === DEX_ENUM.WRAPTOKEN) {
    return [true, true];
  }
  if (!dexId || !router || !payTokenId || !receiveTokenId) {
    return [true, true];
  }

  const routerWhitelist = getRouter(
    dexId,
    chain,
    payTokenId,
    nativeTokenAddress
  );
  const spenderWhitelist = getSpender(dexId, chain);
  const skipSpender =
    !spender ||
    isNativeToken(payTokenId, nativeTokenAddress) ||
    isSwapWrapToken(payTokenId, receiveTokenId, chain, nativeTokenAddress);

  return [
    isSameAddress(routerWhitelist || "", router),
    skipSpender ? true : isSameAddress(spenderWhitelist || "", spender!),
  ];
};
