import axios from "axios";
import { Interface } from "@ethersproject/abi";
import { CHAINS_ENUM, CHAINS } from "@debank/common";
import {
  QuoteParams,
  Tx,
  QuoteResult,
  TxWithChainId,
  DecodeCalldataResult,
} from "../quote";
import { isSameAddress } from "../utils";
import { ZeroXABI } from "../abi";

const NATIVE_TOKEN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

const API_DOMAINS = {
  [CHAINS_ENUM.ETH]: "https://api.0x.org",
  [CHAINS_ENUM.POLYGON]: "https://polygon.api.0x.org",
  [CHAINS_ENUM.BSC]: "https://bsc.api.0x.org",
  [CHAINS_ENUM.OP]: "https://optimism.api.0x.org",
  [CHAINS_ENUM.FTM]: "https://fantom.api.0x.org",
  [CHAINS_ENUM.CELO]: "https://celo.api.0x.org",
  [CHAINS_ENUM.AVAX]: "https://avalanche.api.0x.org",
  [CHAINS_ENUM.ARBITRUM]: "https://arbitrum.api.0x.org",
};

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.FTM,
  CHAINS_ENUM.AVAX,
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.CELO,
];

interface SwapParams {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  takerAddress: string;
  slippagePercentage: number;
  skipValidation: boolean;
  buyTokenPercentageFee?: number;
  feeRecipient?: string;
}

interface SwapResponse extends Tx {
  allowanceTarget: string;
  buyAmount: string;
  sellAmount: string;
  buyTokenAddress: string;
  sellTokenAddress: string;
}

export const getQuote = async (options: QuoteParams): Promise<QuoteResult> => {
  if (!SUPPORT_CHAINS.includes(options.chain)) {
    throw new Error(`${CHAINS[options.chain]} is not support on 1inch`);
  }
  const baseURL = API_DOMAINS[options.chain as keyof typeof API_DOMAINS];
  const request = axios.create({
    baseURL,
  });

  request.interceptors.response.use((response) => {
    const code = response.data?.code;
    const msg = response.data?.reason;

    if (code && code !== 200) {
      if (msg) {
        let err;
        try {
          err = new Error(JSON.parse(msg));
        } catch (e) {
          err = new Error(msg);
        }
        throw err;
      }
      throw new Error(response.data);
    }
    return response;
  });

  const params: SwapParams = {
    sellToken:
      options.fromToken === CHAINS[options.chain].nativeTokenAddress
        ? NATIVE_TOKEN
        : options.fromToken,
    buyToken:
      options.toToken === CHAINS[options.chain].nativeTokenAddress
        ? NATIVE_TOKEN
        : options.toToken,
    sellAmount: options.amount,
    takerAddress: options.userAddress,
    slippagePercentage: options.slippage / 100,
    skipValidation: true,
  };

  if (options.feeRate) {
    params.buyTokenPercentageFee = options.feeRate / 100;
    params.feeRecipient = options.feeAddress;
  }

  const { data } = await request.get<SwapResponse>("/swap/v1/quote", {
    params,
  });

  return {
    tx: {
      data: data.data,
      to: data.to,
      value: data.value,
      from: data.from,
    },
    fromToken: isSameAddress(data.sellTokenAddress, NATIVE_TOKEN)
      ? CHAINS[options.chain].nativeTokenAddress
      : data.sellTokenAddress,
    spender: data.allowanceTarget,
    fromTokenAmount: data.sellAmount,
    toToken: isSameAddress(data.buyTokenAddress, NATIVE_TOKEN)
      ? CHAINS[options.chain].nativeTokenAddress
      : data.buyTokenAddress,
    toTokenAmount: data.buyAmount,
  };
};

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = Object.values(CHAINS).find((item) => item.id === tx.chainId);
  if (!chain) return null;
  const contractInterface = new Interface(ZeroXABI);
  const result = contractInterface.parseTransaction({ data: tx.data });
  if (result.name !== "transformERC20") {
    return null;
  }

  const [inputToken, outputToken, inputTokenAmount, minOutputTokenAmount] =
    result.args;

  if (!inputToken || !outputToken || !inputTokenAmount || !minOutputTokenAmount)
    return null;

  return {
    fromToken: isSameAddress(inputToken, NATIVE_TOKEN)
      ? chain.nativeTokenAddress
      : inputToken,
    fromTokenAmount: inputTokenAmount.toString(),
    toToken: isSameAddress(outputToken, NATIVE_TOKEN)
      ? chain.nativeTokenAddress
      : outputToken,
    minReceiveToTokenAmount: minOutputTokenAmount.toString(),
    toTokenReceiver: tx.from,
  };
};
