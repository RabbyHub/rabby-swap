import { CHAINS_ENUM, CHAINS } from "@debank/common";
import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote } from "../utils";
import { DEX_ENUM } from "../consts";

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.FTM,
  CHAINS_ENUM.ERA,
  CHAINS_ENUM.MANTLE,
  CHAINS_ENUM.BASE,
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.AVAX,
  CHAINS_ENUM.LINEA,
  CHAINS_ENUM.SCRL,
  // CHAINS_ENUM.MODE,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "odos",
  dex: DEX_ENUM.ODOS,
});

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  return null;
};
