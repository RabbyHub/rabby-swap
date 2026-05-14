import { CHAINS, CHAINS_ENUM } from "@debank/common";
import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote, isSameAddress } from "../utils";
import { DEX_ENUM } from "../consts";
import { Interface } from "@ethersproject/abi";
import { SushiABI } from "../abi";
const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.CRO,
  CHAINS_ENUM.RSK,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.GNOSIS,
  CHAINS_ENUM.FUSE,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.MANTA,
  CHAINS_ENUM.FTM,
  CHAINS_ENUM.ERA,
  CHAINS_ENUM.METIS,
  CHAINS_ENUM.CORE,
  CHAINS_ENUM.KAVA,
  CHAINS_ENUM.MANTLE,
  CHAINS_ENUM.ZETA,
  CHAINS_ENUM.BASE,
  CHAINS_ENUM.MODE,
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.CELO,
  CHAINS_ENUM.AVAX,
  CHAINS_ENUM.LINEA,
  CHAINS_ENUM.BLAST,
  CHAINS_ENUM.SCRL,
  "MONAD" as CHAINS_ENUM,
  "SONIC" as CHAINS_ENUM,
  "XLAYER" as CHAINS_ENUM,
  "HYPER" as CHAINS_ENUM,
  "MEGAETH" as CHAINS_ENUM,
  "PLASMA" as CHAINS_ENUM,
  "APE" as CHAINS_ENUM,
  "HEMI" as CHAINS_ENUM,
  "BERA" as CHAINS_ENUM,
  "TAIKO" as CHAINS_ENUM,
  "KATANA" as CHAINS_ENUM,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "sushi",
  dex: DEX_ENUM.SUSHI,
});

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = Object.values(CHAINS).find((item) => item.id === tx.chainId);
  if (!chain) return null;
  const contractInterface = new Interface(SushiABI);
  const result = contractInterface.parseTransaction({ data: tx.data });
  if (result.name !== "snwap") {
    return null;
  }

  const [
    tokenIn,
    amountIn,
    recipient,
    tokenOut,
    amountOutMin,
    executor,
    executorData,
  ] = result.args;

  if (!tokenIn || !amountIn || !recipient || !tokenOut || !amountOutMin)
    return null;

  return {
    fromToken: isSameAddress(tokenIn, NATIVE_TOKEN)
      ? chain.nativeTokenAddress
      : tokenIn,
    fromTokenAmount: amountIn.toString(),
    toToken: isSameAddress(tokenOut, NATIVE_TOKEN)
      ? chain.nativeTokenAddress
      : tokenOut,
    minReceiveToTokenAmount: amountOutMin.toString(),
    toTokenReceiver: recipient,
  };
};
