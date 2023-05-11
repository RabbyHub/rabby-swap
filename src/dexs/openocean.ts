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
import { OpenOceanABI } from "../abi";

const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const chainCode = {
  [CHAINS_ENUM.ETH]: "eth",
  [CHAINS_ENUM.POLYGON]: "polygon",
  [CHAINS_ENUM.BSC]: "bsc",
  [CHAINS_ENUM.OP]: "optimism",
  [CHAINS_ENUM.FTM]: "fantom",
  [CHAINS_ENUM.AVAX]: "avax",
  [CHAINS_ENUM.ARBITRUM]: "arbitrum",
  [CHAINS_ENUM.CRO]: "cronos",
  [CHAINS_ENUM.GNOSIS]: "xdai",
  [CHAINS_ENUM.AURORA]: "aurora",
  [CHAINS_ENUM.BOBA]: "boba",
  [CHAINS_ENUM.KAVA]: "kava",
  [CHAINS_ENUM.METIS]: "metis",
};

export const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.FTM,
  CHAINS_ENUM.AVAX,
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.CRO,
  CHAINS_ENUM.GNOSIS,
  CHAINS_ENUM.AURORA,
  CHAINS_ENUM.BOBA,
  CHAINS_ENUM.KAVA,
  CHAINS_ENUM.METIS,
];

interface SwapParams {
  inTokenAddress: string;
  outTokenAddress: string;
  amount: string;
  gasPrice: number;
  slippage: number;
  account: string;
  referrer?: string;
  referrerFee?: number;
}

interface OpenOceanTokenItem {
  address: string;
  decimals: number;
  name: string;
  symbol: string;
}

interface SwapResponse extends Tx {
  minOutAmount: string;
  outAmount: string;
  inAmount: string;
  outToken: OpenOceanTokenItem;
  inToken: OpenOceanTokenItem;
}

export const getQuote = async (options: QuoteParams): Promise<QuoteResult> => {
  if (!SUPPORT_CHAINS.includes(options.chain)) {
    throw new Error(`${CHAINS[options.chain]} is not support on 1inch`);
  }
  const swapChainCode = chainCode[options.chain as keyof typeof chainCode];
  const baseURL = `https://open-api.openocean.finance/v3/${swapChainCode}`;
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
    inTokenAddress: options.fromToken,
    outTokenAddress: options.toToken,
    amount: options.amount,
    slippage: options.slippage,
    gasPrice: options.gasPrice || 1,
    account: options.userAddress,
  };

  if (options.feeRate !== null && options.feeRate !== undefined) {
    params.referrerFee = options.feeRate;
    params.referrer = options.feeAddress;
  }

  const { data } = await request.get<SwapResponse>("/swap-quote", {
    params,
  });

  return {
    tx: {
      data: data.data,
      to: data.to,
      value: data.value,
      from: data.from,
    },
    fromToken: isSameAddress(data.inToken.address, NATIVE_TOKEN)
      ? CHAINS[options.chain].nativeTokenAddress
      : data.inToken.address,
    spender: data.from,
    fromTokenAmount: data.inAmount,
    toToken: isSameAddress(data.outToken.address, NATIVE_TOKEN)
      ? CHAINS[options.chain].nativeTokenAddress
      : data.outToken.address,
    toTokenAmount: data.inAmount,
  };
};

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = Object.values(CHAINS).find((item) => item.id === tx.chainId);
  if (!chain) return null;
  const contractInterface = new Interface(OpenOceanABI);
  const result = contractInterface.parseTransaction({ data: tx.data });
  if (result.name !== "swap") {
    return null;
  }

  const [caller, data] =
    result.args;
  const [srcToken, dstToken, srcReceiver, dstReceiver, amount, minReturnAmount] = data;

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
    toTokenReceiver: tx.from,
  };
};
