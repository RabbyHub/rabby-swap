import abiCoder from "web3-eth-abi";
import { WrapTokenAddressMap, WRAP_TOKEN_SUPPORT_CHAINS } from "../list";
import { QuoteParams, Tx, QuoteResult } from "../quote";
import { isSameAddress } from "../utils";

export const SUPPORT_CHAINS = WRAP_TOKEN_SUPPORT_CHAINS;

export const getQuote = async (options: QuoteParams): Promise<QuoteResult> => {
  if (!options.chainServerId || !options.nativeTokenAddress) {
    throw new Error(`lack chainServerId or nativeTokenAddress is not support`);
  }
  const wrapTokenAddress =
    WrapTokenAddressMap[options.chain as keyof typeof WrapTokenAddressMap];
  if (!wrapTokenAddress) {
    throw new Error(`${options.chain} does not support native token wrapping`);
  }
  let calldata = "";
  let value = "0";
  if (
    options.fromToken === options.nativeTokenAddress &&
    isSameAddress(options.toToken, wrapTokenAddress)
  ) {
    calldata = abiCoder.encodeFunctionCall(
      {
        constant: false,
        inputs: [],
        name: "deposit",
        outputs: [],
        payable: true,
        stateMutability: "payable",
        type: "function",
      },
      []
    );
    value = options.amount;
  } else {
    calldata = abiCoder.encodeFunctionCall(
      {
        constant: false,
        inputs: [{ name: "wad", type: "uint256" }],
        name: "withdraw",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
      },
      [options.amount]
    );
  }

  return {
    tx: {
      from: options.userAddress,
      to: wrapTokenAddress,
      value,
      data: calldata,
    },
    fromToken: options.fromToken,
    fromTokenAmount: options.amount,
    toToken: options.toToken,
    toTokenAmount: options.amount,
    spender: wrapTokenAddress,
  };
};
