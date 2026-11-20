import { CHAINS } from "./chains";
import type { SwapChain } from "./chains";

export type SwapChainInfo = Pick<
  SwapChain,
  "enum" | "id" | "serverId" | "nativeTokenAddress"
>;

const CHAIN_LIST: SwapChainInfo[] = Object.values(CHAINS);

const findChain = (
  match: (chain: SwapChainInfo) => boolean
): SwapChainInfo | undefined => CHAIN_LIST.find(match);

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
