import { CHAINS_ENUM } from '@debank/common';
import { DEX_ENUM } from './consts';
import { getQuote as wrapTokenGetQuote } from './dexs/wrapToken';
import { getQuote as oneInchGetQuote } from './dexs/1inch';
import { getQuote as zeroXGetQuote } from './dexs/0xapi';
import { getQuote as paraSwapGetQuote } from './dexs/paraswap';

export interface QuoteParams {
  fromToken: string;
  fromTokenDecimals: number;
  toToken: string;
  amount: string;
  userAddress: string;
  slippage: number;
  feeRate?: number;
  feeAddress?: string;
  chain: CHAINS_ENUM;
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

export interface QuoteResult {
  tx: Tx;
  fromToken: string;
  fromTokenDecimals?: number;
  fromTokenAmount: string;
  toToken: string;
  toTokenDecimals?: number;
  toTokenAmount: string;
  spender: string;
}

export const getQuote = async (id: DEX_ENUM, params: QuoteParams) => {
  switch(id) {
    case DEX_ENUM.WRAPTOKEN:
      return await wrapTokenGetQuote(params);
    case DEX_ENUM.ONEINCH:
      return await oneInchGetQuote(params);
    case DEX_ENUM.PARASWAP:
      return await paraSwapGetQuote(params);
    case DEX_ENUM.ZEROXAPI:
      return await zeroXGetQuote(params);
    default:
      throw new Error(`${id} is not supported!`);
  }
}