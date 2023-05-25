import axios from "axios";
import { Interface } from "@ethersproject/abi";
import { CHAINS_ENUM, CHAINS } from "@debank/common";
import BigNumber from "bignumber.js";
import {
  QuoteParams,
  Tx,
  QuoteResult,
  TxWithChainId,
  DecodeCalldataResult,
} from "../quote";
import { isSameAddress } from "../utils";
import { OpenOceanABI } from "../abi";

const NATIVE_TOKENS = {
  [CHAINS_ENUM.ETH]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.POLYGON]: "0x0000000000000000000000000000000000001010",
  [CHAINS_ENUM.BSC]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.OP]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.FTM]: "0x0000000000000000000000000000000000000000",
  [CHAINS_ENUM.AVAX]: "0x0000000000000000000000000000000000000000",
  [CHAINS_ENUM.ARBITRUM]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.CRO]: "0x0000000000000000000000000000000000000000",
  [CHAINS_ENUM.GNOSIS]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.AURORA]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.BOBA]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  [CHAINS_ENUM.KAVA]: "0x0000000000000000000000000000000000000000",
  [CHAINS_ENUM.METIS]: "0x0000000000000000000000000000000000000000",
} as Record<CHAINS_ENUM, string>;

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
  /**
   * 接口耗时久
   */
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.CRO,
  /**
   * approve and swap 预执行失败
   */
  CHAINS_ENUM.AURORA,

  /**
   * 接口返回 swap error
   */
  // CHAINS_ENUM.METIS,
  /**
   * 未开源
   */
  // CHAINS_ENUM.GNOSIS,
  // CHAINS_ENUM.BOBA,
  // CHAINS_ENUM.KAVA,
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
    throw new Error(`${CHAINS[options.chain]} is not support on OpenOcean`);
  }
  const swapChainCode = chainCode[options.chain as keyof typeof chainCode];
  const baseURL = `https://open-api.openocean.finance/v3/${swapChainCode}`;
  const request = axios.create({
    baseURL,
  });

  request.interceptors.response.use((response) => {
    const code = response.data?.code;
    const msg = response.data?.reason;

    if (code === 200) return response.data;

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

  const NATIVE_TOKEN = NATIVE_TOKENS[options.chain];

  const params: SwapParams = {
    inTokenAddress:
      options.fromToken === CHAINS[options.chain].nativeTokenAddress
        ? NATIVE_TOKEN
        : options.fromToken,
    outTokenAddress:
      options.toToken === CHAINS[options.chain].nativeTokenAddress
        ? NATIVE_TOKEN
        : options.toToken,
    amount: new BigNumber(options.amount)
      .div(10 ** options.fromTokenDecimals)
      .toFixed(),
    slippage: options.slippage,
    gasPrice: options.gasPrice || 1,
    account: options.userAddress,
  };

  if (options.feeRate !== null && options.feeRate !== undefined) {
    params.referrerFee = options.feeRate;
    params.referrer = options.feeAddress;
  }

  const { data } = await request.get<SwapResponse>("/swap_quote", {
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
    spender: data.to,
    fromTokenAmount: data.inAmount,
    toToken: isSameAddress(data.outToken.address, NATIVE_TOKEN)
      ? CHAINS[options.chain].nativeTokenAddress
      : data.outToken.address,
    toTokenAmount: data.outAmount,
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

  const [caller, data] = result.args;
  const [
    srcToken,
    dstToken,
    srcReceiver,
    dstReceiver,
    amount,
    minReturnAmount,
  ] = data;

  if (!srcToken || !dstToken || !dstReceiver || !amount || !minReturnAmount)
    return null;

  const NATIVE_TOKEN = NATIVE_TOKENS[chain.enum];

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
