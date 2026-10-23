import { CHAINS_ENUM } from "@debank/common";
import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote } from "../utils";
import { DEX_ENUM } from "../consts";

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.BASE,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.AVAX,
  "BERA" as CHAINS_ENUM,
  "UNI" as CHAINS_ENUM,
  CHAINS_ENUM.SCRL,
  "PLASMA" as CHAINS_ENUM,
  "MONAD" as CHAINS_ENUM,
  "HYPER" as CHAINS_ENUM,
  "HOOD" as CHAINS_ENUM,
  "ARC" as CHAINS_ENUM,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "matcha_v2",
  dex: DEX_ENUM.ZEROXAPIV2,
});

export const decodeCalldata = (
  _tx: TxWithChainId
): DecodeCalldataResult | null => {
  return null;
};
