import { CHAINS_ENUM, CHAINS } from "@debank/common";
import { Interface } from "@ethersproject/abi";

import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote } from "../utils";
import { UniswapABI } from "../abi";

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.ARBITRUM,
];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "uniswap3",
  dex: "Uniswap",
});

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = Object.values(CHAINS).find((item) => item.id === tx.chainId);
  if (!chain) return null;
  const contractInterface = new Interface(UniswapABI);
  const result = contractInterface.parseTransaction({ data: tx.data });

  if (result.name === "multicall" && result?.args?.data?.length === 2) {
    const data = result?.args?.data;
    if (data.startsWith("0x49404b7c")) {
      const result = decodeCalldataExactInput(data[0]);
      if (result) {
        return {
          ...result,
          toToken: chain.nativeTokenAddress,
        };
      }
    }
  }

  return decodeCalldataExactInput(tx);
};

function decodeCalldataExactInput(
  tx: TxWithChainId
): DecodeCalldataResult | null {
  const chain = Object.values(CHAINS).find((item) => item.id === tx.chainId);
  if (!chain) return null;
  const contractInterface = new Interface(UniswapABI);
  const result = contractInterface.parseTransaction({ data: tx.data });

  if (result.name === "") {
    return null;
  }

  const [path, recipient, dstReceiver, amount, minReturnAmount] =
    result.args[0];

  let srcToken: string = "";
  let dstToken: string = "";
  if (!path) {
    return null;
  }

  srcToken = "0x" + path.slice(2, 42);
  dstToken = "0x" + path.slice(-40);

  if (!srcToken || !dstToken || !recipient || !amount || !minReturnAmount)
    return null;

  return {
    fromToken: srcToken,
    fromTokenAmount: amount.toString(),
    toToken: dstToken,
    minReceiveToTokenAmount: minReturnAmount.toString(),
    toTokenReceiver: dstReceiver,
  };
}
