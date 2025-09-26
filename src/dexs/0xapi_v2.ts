import { Interface } from "@ethersproject/abi";
import { CHAINS_ENUM, CHAINS } from "@debank/common";
import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote, isSameAddress } from "../utils";
import { ZeroXABI } from "../abi";
import { DEX_ENUM } from "../consts";

const NATIVE_TOKEN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

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
  "Plasma" as CHAINS_ENUM,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "matcha_v2",
  dex: DEX_ENUM.ZEROXAPIV2,
});

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  return null;
};
