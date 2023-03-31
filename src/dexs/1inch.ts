import axios from "axios";
import { CHAINS_ENUM, CHAINS } from "@debank/common";
import { Interface } from "@ethersproject/abi";
import {
  QuoteParams,
  Tx,
  QuoteResult,
  TxWithChainId,
  DecodeCalldataResult,
} from "../quote";
import { isSameAddress } from "../utils";
import { OneInchABI } from "../abi";

const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const request = axios.create({
  baseURL: "https://api.1inch.io/v5.0",
});

request.interceptors.response.use((response) => {
  const code = response.data?.statusCode;
  const msg = response.data?.description || response.data?.error;

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
];

interface SwapParams {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  fromAddress: string;
  slippage: number;
  disableEstimate: boolean;
  fee?: number;
  referrerAddress?: string;
}

type IToken = {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  logoURI: string;
  tags: string[];
  eip2612?: boolean;
};

interface SwapResponse {
  fromToken: IToken;
  toToken: IToken;
  toTokenAmount: string;
  fromTokenAmount: string;
  tx: Tx;
}

export const getQuote = async (options: QuoteParams): Promise<QuoteResult> => {
  const chainId = CHAINS[options.chain].id;

  if (!SUPPORT_CHAINS.includes(options.chain)) {
    throw new Error(`${CHAINS[options.chain]} is not support on 1inch`);
  }

  const params: SwapParams = {
    fromTokenAddress:
      options.fromToken === CHAINS[options.chain].nativeTokenAddress
        ? NATIVE_TOKEN
        : options.fromToken,
    toTokenAddress:
      options.toToken === CHAINS[options.chain].nativeTokenAddress
        ? NATIVE_TOKEN
        : options.toToken,
    amount: options.amount,
    fromAddress: options.userAddress,
    slippage: options.slippage,
    disableEstimate: true,
  };

  if (options.feeRate !== null && options.feeRate !== undefined) {
    params.fee = options.feeRate;
    params.referrerAddress = options.feeAddress;
  }

  const { data } = await request.get<SwapResponse>(`/${chainId}/swap`, {
    params,
  });

  return {
    tx: data.tx,
    fromToken: isSameAddress(data.fromToken.address, NATIVE_TOKEN)
      ? CHAINS[options.chain].nativeTokenAddress
      : data.fromToken.address,
    fromTokenAmount: data.fromTokenAmount,
    fromTokenDecimals: data.fromToken.decimals,
    toToken: isSameAddress(data.toToken.address, NATIVE_TOKEN)
      ? CHAINS[options.chain].nativeTokenAddress
      : data.toToken.address,
    toTokenAmount: data.toTokenAmount,
    toTokenDecimals: data.toToken.decimals,
    spender: data.tx.to,
  };
};

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = Object.values(CHAINS).find((item) => item.id === tx.chainId);
  if (!chain) return null;
  const contractInterface = new Interface(OneInchABI);
  const result = contractInterface.parseTransaction({ data: tx.data });

  if (result.name !== "swap") {
    return null;
  }

  const [executor, desc] = result.args;
  const [
    srcToken,
    dstToken,
    srcReceiver,
    dstReceiver,
    amount,
    minReturnAmount,
  ] = desc;

  if (!srcToken || !dstToken || !dstReceiver || !amount || !minReturnAmount)
    return null;

  return {
    fromToken: isSameAddress(srcToken, NATIVE_TOKEN)
      ? chain.nativeTokenAddress
      : srcToken,
    fromTokenAmount: amount.toString(),
    toToken: isSameAddress(dstToken, NATIVE_TOKEN)
      ? chain.nativeTokenAddress
      : dstToken,
    minReceiveToTokenAmount: minReturnAmount.toString(),
    toTokenReceiver: dstReceiver,
  };
};
