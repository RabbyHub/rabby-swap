import { CHAINS, CHAINS_ENUM } from "@debank/common";
import { TxWithChainId, DecodeCalldataResult } from "../quote";
import { generateGetQuote, isSameAddress, NULL_ADDRESS } from "../utils";
import { DEX_ENUM } from "../consts";
import { Interface } from "@ethersproject/abi";
import { FlowRouterABI } from "../abi";

// FlowRouter sends the output to outputReceiver exactly as encoded: address(0) is NOT mapped to msg.sender.
// A zero receiver is therefore decoded as this address, so it fails isSwapCalldataReceiverAllowed (which
// accepts NULL_ADDRESS because other routers send to msg.sender).
const UNUSABLE_RECEIVER = "0x000000000000000000000000000000000000dEaD";

export const SUPPORT_CHAINS = ["HOOD" as CHAINS_ENUM];

export const getQuote = generateGetQuote({
  SUPPORT_CHAINS,
  id: "flowrouter",
  dex: DEX_ENUM.FLOWROUTER,
});

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  if (tx.chainId !== 4663) return null;
  const chain = Object.values(CHAINS).find((item) => item.id === tx.chainId);
  if (!chain) return null;
  const contractInterface = new Interface(FlowRouterABI);
  const result = contractInterface.parseTransaction({ data: tx.data });
  if (result.name !== "swap" && result.name !== "swapPermit2") {
    return null;
  }
  // Reject truncated dynamic data, invalid hex and non-canonical ABI encodings.
  if (contractInterface.encodeFunctionData(result.name, result.args).toLowerCase() !== tx.data.toLowerCase()) {
    return null;
  }

  const { tokenInfo } = result.args;
  const { inputToken, inputAmount, outputToken, outputMin, outputReceiver } =
    tokenInfo;

  if (!inputToken || !inputAmount || !outputToken || !outputMin || !outputReceiver)
    return null;

  // FlowRouter uses address(0) for native ETH. inputAmount 0 means "the whole balance" on chain; it is
  // returned as "0", so it never matches a quoted amount.
  return {
    fromToken: isSameAddress(inputToken, NULL_ADDRESS)
      ? chain.nativeTokenAddress
      : inputToken,
    fromTokenAmount: inputAmount.toString(),
    toToken: isSameAddress(outputToken, NULL_ADDRESS)
      ? chain.nativeTokenAddress
      : outputToken,
    minReceiveToTokenAmount: outputMin.toString(),
    toTokenReceiver: isSameAddress(outputReceiver, NULL_ADDRESS)
      ? UNUSABLE_RECEIVER
      : outputReceiver,
  };
};
