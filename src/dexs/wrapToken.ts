import abiCoder from "web3-eth-abi";
import { CHAINS_ENUM, CHAINS } from "@debank/common";
import { WrapTokenAddressMap } from "../list";
import { QuoteParams, Tx, QuoteResult } from "../quote";
import { isSameAddress } from "../utils";

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.FTM,
  CHAINS_ENUM.AVAX,
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.KLAY,
  CHAINS_ENUM.GNOSIS,
  // CHAINS_ENUM.CELO,
  CHAINS_ENUM.CRO,
  CHAINS_ENUM.AURORA,
  CHAINS_ENUM.LINEA,
  // CHAINS_ENUM.BTT,
  CHAINS_ENUM.BASE,
  CHAINS_ENUM.ERA,
  // CHAINS_ENUM.PZE,
  // CHAINS_ENUM.ROSE,
  CHAINS_ENUM.SCRL,
  CHAINS_ENUM.MODE,
  CHAINS_ENUM.MANTLE,
  "SONIC" as CHAINS_ENUM,
];

export const getQuote = async (options: QuoteParams): Promise<QuoteResult> => {
  if (!options.chainServerId || !options.nativeTokenAddress) {
    throw new Error(`lack chainServerId or nativeTokenAddress is not support`);
  }
  const wrapTokenAddress =
    WrapTokenAddressMap[options.chain as keyof typeof WrapTokenAddressMap];
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
