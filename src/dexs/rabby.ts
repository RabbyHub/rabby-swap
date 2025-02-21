import { CHAINS_ENUM } from "@debank/common";

import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote } from "../utils";
import { DEX_ENUM } from "../consts";

const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const SUPPORT_CHAINS = [CHAINS_ENUM.ETH];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "rabby",
  dex: DEX_ENUM.RABBY,
});

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  return null;
};
