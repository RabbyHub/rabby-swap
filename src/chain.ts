import { CHAINS } from "@debank/common";
import type { Chain } from "@debank/common";
import { CHAINS as FALLBACK_CHAINS } from "./chains";

export type SwapChainInfo = Pick<
  Chain,
  "enum" | "id" | "serverId" | "nativeTokenAddress"
>;

const findChain = (
  match: (chain: { enum: string; id: number; serverId: string }) => boolean
): SwapChainInfo | undefined =>
  (Object.values(CHAINS).find(match) ??
    Object.values(FALLBACK_CHAINS).find(match)) as SwapChainInfo | undefined;

export const getChainById = (chainId: number) =>
  findChain((chain) => chain.id === chainId);

export const getChainByEnum = (chainEnum: string) =>
  findChain((chain) => chain.enum === chainEnum);

export const getChainByServerId = (serverId: string) =>
  findChain((chain) => chain.serverId === serverId);

export const getNativeTokenAddress = (chainId: number) => {
  const native = getChainById(chainId)?.nativeTokenAddress;
  if (!native) {
    throw new Error(`Native token is not configured for chain ${chainId}`);
  }
  return native;
};
