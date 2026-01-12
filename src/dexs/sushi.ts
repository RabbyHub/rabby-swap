import { CHAINS_ENUM } from "@debank/common";
import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote } from "../utils";
import { DEX_ENUM } from "../consts";

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.CELO,
  CHAINS_ENUM.KAVA,
  "NOVA" as CHAINS_ENUM,
  "ZETA" as CHAINS_ENUM,
  "KATANA" as CHAINS_ENUM,
  "HEMI" as CHAINS_ENUM,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "sushi",
  dex: DEX_ENUM.SUSHI,
});

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  return null;
};

