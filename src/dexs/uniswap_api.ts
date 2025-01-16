import { CHAINS_ENUM } from "@debank/common";
import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote } from "../utils";
import { DEX_ENUM } from "../consts";

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.AVAX,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.BASE,
  CHAINS_ENUM.BLAST,
  CHAINS_ENUM.ERA,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "uni",
  dex: DEX_ENUM.UNISWAP_API,
});

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  return null;
};
