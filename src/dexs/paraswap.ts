import axios from "axios";
import { CHAINS_ENUM, CHAINS } from "@debank/common";
import { QuoteParams, Tx, QuoteResult } from "../quote";

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
];

interface PriceParams {
  srcToken: string;
  srcDecimals: number;
  destToken: string;
  amount: string;
  userAddress: string;
  network: number;
  includeContractMethods: string;
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
    srcToken: options.fromToken === CHAINS[options.chain].nativeTokenAddress ? NATIVE_TOKEN : options.fromToken,
    destToken: options.toToken === CHAINS[options.chain].nativeTokenAddress ? NATIVE_TOKEN : options.toToken,
    amount: options.amount,
    userAddress: options.userAddress,
    network: chainId,
    includeContractMethods: 'simpleSwap,multiSwap,megaSwap',
  });

  const params: SwapParams = {
    srcToken: options.fromToken === CHAINS[options.chain].nativeTokenAddress ? NATIVE_TOKEN : options.fromToken,
    srcDecimals: options.fromTokenDecimals,
    destToken: options.toToken === CHAINS[options.chain].nativeTokenAddress ? NATIVE_TOKEN : options.toToken,
    srcAmount: options.amount,
    userAddress: options.userAddress,
    slippage: Math.floor(options.slippage * 100),
    priceRoute: priceRoute,
  };

  if (options.feeRate) {
    params.partnerFeeBps = (options.feeRate * 100).toString();
    params.partnerAddress = options.feeAddress;
  }

  const { data } = await request.get<Tx>(`/transactions/${chainId}`, {
    params: {
      ignoreChecks: true,
      ignoreGasEstimate: true,
    },
    data: params,
  });
 
  return {
    tx: data,
    fromToken: priceRoute.srcToken === NATIVE_TOKEN ? CHAINS[options.chain].nativeTokenAddress : priceRoute.srcToken,
    fromTokenAmount: priceRoute.srcAmount,
    fromTokenDecimals: priceRoute.srcDecimals,
    toToken: priceRoute.destToken === NATIVE_TOKEN ? CHAINS[options.chain].nativeTokenAddress : priceRoute.destToken,
    toTokenAmount: priceRoute.destAmount,
    toTokenDecimals: priceRoute.destDecimals,
    spender: data.to,
  };
};
