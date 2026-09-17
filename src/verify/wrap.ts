import { CHAINS_ENUM } from "@debank/common";
import { WrapTokenAddressMap } from "../list";
import { isSameAddress } from "../utils";

/**
 * 是否为「链上 native ↔ 包装代币」互换。
 * native 地址由调用方传入，不在库内查链目录（自定义链只存在于应用侧）。
 */
export const isSwapWrapToken = (
  payTokenId: string,
  receiveTokenId: string,
  chain: CHAINS_ENUM,
  nativeTokenAddress: string
) => {
  const wrapTokens = [
    WrapTokenAddressMap[chain as keyof typeof WrapTokenAddressMap],
    nativeTokenAddress,
  ];
  return (
    !!payTokenId &&
    !!receiveTokenId &&
    payTokenId !== receiveTokenId &&
    !!wrapTokens.find((token) => isSameAddress(payTokenId, token)) &&
    !!wrapTokens.find((token) => isSameAddress(receiveTokenId, token))
  );
};
