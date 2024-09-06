import { CHAINS_ENUM } from "@debank/common";
import { OpenApiService } from "@rabby-wallet/rabby-api";
import { DEX_ENUM } from "./consts";
import { getQuote as wrapTokenGetQuote } from "./dexs/wrapToken";
import {
  getQuote as oneInchGetQuote,
  decodeCalldata as oneInchDecodeCalldata,
} from "./dexs/1inch";
import {
  getQuote as zeroXGetQuote,
  decodeCalldata as zeroXDecodeCalldata,
} from "./dexs/0xapi";
import {
  getQuote as paraSwapGetQuote,
  decodeCalldata as paraSwapDecodeCalldata,
} from "./dexs/paraswap";
import {
  getQuote as openOceanGetQuote,
  decodeCalldata as openOceanDecodeCalldata,
} from "./dexs/openocean";
import {
  getQuote as uniswapGetQuote,
  decodeCalldata as uniswapDecodeCalldata,
} from "./dexs/uniswap";

import {
  getQuote as kyberswapGetQuote,
  decodeCalldata as kyberswapDecodeCalldata,
} from "./dexs/kyberswap";

import {
  getQuote as paraSwapV6GetQuote,
  decodeCalldata as paraSwapV6DecodeCalldata,
} from "./dexs/paraswap_v6";

export interface QuoteParams {
  fromToken: string;
  fromTokenDecimals: number;
  toToken: string;
  amount: string;
  userAddress: string;
  slippage: number;
  feeRate?: number;
  feeAddress?: string;
  gasPrice?: number;
  chain: CHAINS_ENUM;
  fee?: boolean;
}

export interface Tx {
  from: string;
  to: string;
  data: string;
  value: string;
  chainId?: number;
  gas?: number;
  gasPrice?: string;
}

export interface TxWithChainId extends Tx {
  chainId: number;
}

export interface QuoteResult {
  tx: Tx;
  fromToken: string;
  fromTokenDecimals?: number;
  fromTokenAmount: string;
  toToken: string;
  toTokenDecimals?: number;
  toTokenAmount: string;
  spender: string;
  dexFeeDesc?: string | null;
}

export const getQuote = async (
  id: DEX_ENUM,
  params: QuoteParams,
  api: OpenApiService
) => {
  switch (id) {
    case DEX_ENUM.WRAPTOKEN:
      return await wrapTokenGetQuote(params);
    case DEX_ENUM.ONEINCH:
      return await oneInchGetQuote(params, api);
    case DEX_ENUM.PARASWAP:
      return await paraSwapGetQuote(params, api);
    case DEX_ENUM.ZEROXAPI:
      return await zeroXGetQuote(params, api);
    case DEX_ENUM.OPENOCEAN:
      return await openOceanGetQuote(params, api);
    case DEX_ENUM.UNISWAP:
      return await uniswapGetQuote(params, api);
    case DEX_ENUM.KYBERSWAP:
      return await kyberswapGetQuote(params, api);
    case DEX_ENUM.PARASWAPV6:
      return await paraSwapV6GetQuote(params, api);
    default:
      throw new Error(`${id} is not supported!`);
  }
};

export interface DecodeCalldataResult {
  fromToken: string;
  fromTokenAmount: string;
  toToken: string;
  minReceiveToTokenAmount: string;
  toTokenReceiver: string;
}

export const decodeCalldata = (
  id: DEX_ENUM,
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  switch (id) {
    case DEX_ENUM.ONEINCH:
      return oneInchDecodeCalldata(tx);
    case DEX_ENUM.PARASWAP:
      return paraSwapDecodeCalldata(tx);
    case DEX_ENUM.ZEROXAPI:
      return zeroXDecodeCalldata(tx);
    case DEX_ENUM.OPENOCEAN:
      return openOceanDecodeCalldata(tx);
    case DEX_ENUM.UNISWAP:
      return uniswapDecodeCalldata(tx);
    case DEX_ENUM.KYBERSWAP:
      return kyberswapDecodeCalldata(tx);
    case DEX_ENUM.PARASWAPV6:
      return paraSwapV6DecodeCalldata(tx);
    default:
      throw new Error(`${id} is not supported!`);
  }
};
