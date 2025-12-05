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
  CHAINS_ENUM.FTM,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.BASE,
  CHAINS_ENUM.PZE,
  "SONIC" as CHAINS_ENUM,
  CHAINS_ENUM.BLAST,
  CHAINS_ENUM.MANTA,
  CHAINS_ENUM.METIS,
  CHAINS_ENUM.SCRL,
  CHAINS_ENUM.ERA,
  CHAINS_ENUM.LINEA,
  "INK" as CHAINS_ENUM,
  "BERA" as CHAINS_ENUM,
  "TAIKO" as CHAINS_ENUM,
  "UNI" as CHAINS_ENUM,
  "ABS" as CHAINS_ENUM,
  "PLASMA" as CHAINS_ENUM,
  "HYPER" as CHAINS_ENUM,
  "MONAD" as CHAINS_ENUM,
  "STABLE" as CHAINS_ENUM,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "magpie",
  dex: DEX_ENUM.MAGPIE,
});

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  return null;
};
