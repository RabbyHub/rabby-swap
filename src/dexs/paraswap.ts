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
import { ParaSwapABI } from "../abi";
import { DEX_ENUM, DEX_SPENDER_WHITELIST } from "../consts";

const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const request = axios.create({
  baseURL: "https://apiv5.paraswap.io",
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
  CHAINS_ENUM.AVAX,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.FTM,
];

interface PriceParams {
  srcToken: string;
  srcDecimals: number;
  destToken: string;
  amount: string;
  userAddress: string;
  network: number;
  includeContractMethods: string;
  partner: string;
  excludeDEXS: string;
}

interface PriceResponse {
  priceRoute: PriceRoute;
}

interface PriceRoute {
  blockNumber: number;
  network: number;
  srcToken: string;
  srcDecimals: number;
  srcAmount: string;
  destToken: string;
  destDecimals: number;
  destAmount: string;
  bestRoute: any[];
  gasCostUSD: string;
  gasCost: string;
  side: string;
  tokenTransferProxy: string;
  contractAddress: string;
  contractMethod: string;
  partnerFee: number;
  srcUSD: string;
  destUSD: string;
  partner: string;
  maxImpactReached: boolean;
  hmac: string;
}

interface SwapParams {
  srcToken: string;
  srcDecimals: number;
  destToken: string;
  slippage: number;
  partnerAddress?: string;
  partnerFeeBps?: string;
  userAddress: string;
  srcAmount: string;
  priceRoute: PriceRoute;
  partner: string;
}

const getPriceRoute = async (params: PriceParams): Promise<PriceResponse> => {
  const { data } = await request.get("/prices", {
    params,
  });
  return data;
};

export const getQuote = async (options: QuoteParams): Promise<QuoteResult> => {
  const chainId = CHAINS[options.chain].id;

  if (!SUPPORT_CHAINS.includes(options.chain)) {
    throw new Error(`${CHAINS[options.chain]} is not support on 1inch`);
  }

  const { priceRoute } = await getPriceRoute({
    srcDecimals: options.fromTokenDecimals,
    srcToken:
      options.fromToken === CHAINS[options.chain].nativeTokenAddress
        ? NATIVE_TOKEN
        : options.fromToken,
    destToken:
      options.toToken === CHAINS[options.chain].nativeTokenAddress
        ? NATIVE_TOKEN
        : options.toToken,
    amount: options.amount,
    userAddress: options.userAddress,
    network: chainId,
    includeContractMethods: "simpleSwap,multiSwap,megaSwap",
    excludeDEXS: 'ParaSwapPool,ParaSwapLimitOrders',
    partner: "Rabby",
  });

  const params: SwapParams = {
    srcToken:
      options.fromToken === CHAINS[options.chain].nativeTokenAddress
        ? NATIVE_TOKEN
        : options.fromToken,
    srcDecimals: options.fromTokenDecimals,
    destToken:
      options.toToken === CHAINS[options.chain].nativeTokenAddress
        ? NATIVE_TOKEN
        : options.toToken,
    srcAmount: options.amount,
    userAddress: options.userAddress,
    slippage: Math.floor(options.slippage * 100),
    priceRoute: priceRoute,
    partner: "Rabby",
  };

  if (options.feeRate !== null && options.feeRate !== undefined) {
    params.partnerFeeBps = (options.feeRate * 100).toString();
    params.partnerAddress = options.feeAddress;
  }

  const { data } = await request.post<Tx>(`/transactions/${chainId}`, params, {
    params: {
      ignoreChecks: true,
      ignoreGasEstimate: true,
      deadline: Math.floor(Date.now() / 1000) + 60 * 30,
    },
  });

  return {
    tx: data,
    fromToken:
      priceRoute.srcToken === NATIVE_TOKEN
        ? CHAINS[options.chain].nativeTokenAddress
        : priceRoute.srcToken,
    fromTokenAmount: priceRoute.srcAmount,
    fromTokenDecimals: priceRoute.srcDecimals,
    toToken:
      priceRoute.destToken === NATIVE_TOKEN
        ? CHAINS[options.chain].nativeTokenAddress
        : priceRoute.destToken,
    toTokenAmount: priceRoute.destAmount,
    toTokenDecimals: priceRoute.destDecimals,
    spender:
      DEX_SPENDER_WHITELIST[DEX_ENUM.PARASWAP][
        options.chain as keyof (typeof DEX_SPENDER_WHITELIST)[DEX_ENUM.PARASWAP]
      ],
  };
};

export const decodeCalldata = (
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = Object.values(CHAINS).find((item) => item.id === tx.chainId);
  const nullAddress = "0x0000000000000000000000000000000000000000";

  if (!chain) return null;

  const contractInterface = new Interface(ParaSwapABI);
  const result = contractInterface.parseTransaction({
    data: tx.data,
  });
  switch (result.name) {
    case "simpleSwap": {
      const [data] = result.args;
      const [
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        expectedAmount,
        callees,
        exchangeData,
        startIndexes,
        values,
        beneficiary,
      ] = data;
      if (!fromToken || !toToken || !fromAmount || !toAmount) return null;
      return {
        fromToken: isSameAddress(fromToken, NATIVE_TOKEN)
          ? chain.nativeTokenAddress
          : fromToken,
        fromTokenAmount: fromAmount.toString(),
        toToken: isSameAddress(toToken, NATIVE_TOKEN)
          ? chain.nativeTokenAddress
          : toToken,
        minReceiveToTokenAmount: toAmount.toString(),
        toTokenReceiver: beneficiary === nullAddress ? tx.from : beneficiary,
      };
    }
    case "multiSwap": {
      const [data] = result.args;
      const [
        fromToken,
        fromAmount,
        toAmount,
        expectedAmount,
        beneficiary,
        path,
      ] = data;
      if (!fromToken || !fromAmount || !toAmount || !path || path.length <= 0)
        return null;
      const [toToken] = path[path.length - 1];
      return {
        fromToken: isSameAddress(fromToken, NATIVE_TOKEN)
          ? chain.nativeTokenAddress
          : fromToken,
        fromTokenAmount: fromAmount.toString(),
        toToken: isSameAddress(toToken, NATIVE_TOKEN)
          ? chain.nativeTokenAddress
          : toToken,
        minReceiveToTokenAmount: toAmount.toString(),
        toTokenReceiver: beneficiary === nullAddress ? tx.from : beneficiary,
      };
    }
    case "megaSwap":
      const [data] = result.args;
      const [
        fromToken,
        fromAmount,
        toAmount,
        expectedAmount,
        beneficiary,
        path,
      ] = data;
      if (!fromToken || !fromAmount || !toAmount || !path || path.length <= 0)
        return null;
      const [fromAmountPercent, swapPath] = path[0];
      const [toToken] = swapPath[swapPath.length - 1];
      return {
        fromToken: isSameAddress(fromToken, NATIVE_TOKEN)
          ? chain.nativeTokenAddress
          : fromToken,
        fromTokenAmount: fromAmount.toString(),
        toToken: isSameAddress(toToken, NATIVE_TOKEN)
          ? chain.nativeTokenAddress
          : toToken,
        minReceiveToTokenAmount: toAmount.toString(),
        toTokenReceiver: beneficiary === nullAddress ? tx.from : beneficiary,
      };
    default:
      return null;
  }
};
