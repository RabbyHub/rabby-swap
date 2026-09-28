import { CHAINS, CHAINS_ENUM } from "@debank/common";
import { Interface } from "@ethersproject/abi";
import BigNumber from "bignumber.js";
import { MagpieABI } from "../abi";
import { TxWithChainId, DecodeCalldataResult } from "../quote";
import {
  generateGetQuote,
  isSameAddress,
  NULL_ADDRESS,
  resolveToTokenReceiver,
} from "../utils";
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
  "MEGAETH" as CHAINS_ENUM,
  "KATANA" as CHAINS_ENUM,
  "TEMPO" as CHAINS_ENUM,
  "HOOD" as CHAINS_ENUM,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "magpie",
  dex: DEX_ENUM.MAGPIE,
});

const magpieInterface = new Interface(MagpieABI);

// MagpieRouterV3 LibRouter.getData() 用绝对 calldata 偏移，不是 ABI tuple。
// swapWithMagpieSignature(bytes) 标准编码下 bytes 从第 68 字节开始。
const Packed = {
  toAddress: 72,
  fromAsset: 92,
  toAsset: 112,
  amountOutMin: { shift: 135, ptr: 136 },
  amountIn: { shift: 141, ptr: 142 },
};

const readCompactUint = (
  hex: string,
  field: { shift: number; ptr: number }
) => {
  const shiftBits = hex.slice(field.shift * 2, field.shift * 2 + 2);
  const wordOffset = hex.slice(field.ptr * 2, field.ptr * 2 + 4);
  if (shiftBits.length !== 2 || wordOffset.length !== 4) return null;
  const word = hex.slice(
    parseInt(wordOffset, 16) * 2,
    parseInt(wordOffset, 16) * 2 + 64
  );
  if (word.length !== 64) return null;
  return new BigNumber(word, 16)
    .idiv(new BigNumber(2).pow(parseInt(shiftBits, 16)))
    .toFixed(0);
};

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = Object.values(CHAINS).find((item) => item.id === tx.chainId);
  if (!chain) return null;

  const result = magpieInterface.parseTransaction({ data: tx.data });
  if (result.name !== "swapWithMagpieSignature") return null;

  const hex = tx.data.replace(/^0x/i, "").toLowerCase();
  if (hex.length < (Packed.toAsset + 20) * 2) return null;
  const toAddress = `0x${hex.slice(Packed.toAddress * 2, (Packed.toAddress + 20) * 2)}`;
  const fromAsset = `0x${hex.slice(Packed.fromAsset * 2, (Packed.fromAsset + 20) * 2)}`;
  const toAsset = `0x${hex.slice(Packed.toAsset * 2, (Packed.toAsset + 20) * 2)}`;
  const amountOutMin = readCompactUint(hex, Packed.amountOutMin);
  const amountIn = readCompactUint(hex, Packed.amountIn);

  if (!amountOutMin || !amountIn) {
    return null;
  }

  return {
    fromToken: isSameAddress(fromAsset, NULL_ADDRESS)
      ? chain.nativeTokenAddress
      : fromAsset,
    fromTokenAmount: amountIn,
    toToken: isSameAddress(toAsset, NULL_ADDRESS)
      ? chain.nativeTokenAddress
      : toAsset,
    minReceiveToTokenAmount: amountOutMin,
    toTokenReceiver: resolveToTokenReceiver(toAddress, tx.from),
  };
};
