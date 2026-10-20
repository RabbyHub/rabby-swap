import { CHAINS } from "@debank/common";

export const getNativeTokenAddress = (
  chainId: number,
  nativeTokenAddress?: string
) => {
  const native =
    nativeTokenAddress ??
    Object.values(CHAINS).find((chain) => chain.id === chainId)
      ?.nativeTokenAddress;
  if (!native) {
    throw new Error(`Native token is not configured for chain ${chainId}`);
  }
  return native;
};
