import { CHAINS_ENUM } from '@debank/common';
import { SUPPORT_CHAINS as wrapTokenSupportChains } from './dexs/wrapToken';
import { SUPPORT_CHAINS as zeroXSupportChains } from './dexs/0xapi';
import { SUPPORT_CHAINS as oneInchSupportChains } from './dexs/1inch';
import { SUPPORT_CHAINS as paraswapSupportChains } from './dexs/paraswap';

export enum DEX_ENUM {
  ONEINCH = '1inch',
  PARASWAP = 'ParaSwap',
  ZEROXAPI = '0xAPI',
  WRAPTOKEN = 'WrapToken'
}

export const WrapTokenAddressMap = {
  [CHAINS_ENUM.ETH]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  [CHAINS_ENUM.BSC]: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  [CHAINS_ENUM.POLYGON]: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  [CHAINS_ENUM.OP]: '0x4200000000000000000000000000000000000006',
  [CHAINS_ENUM.FTM]: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
  [CHAINS_ENUM.AVAX]: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
  [CHAINS_ENUM.ARBITRUM]: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  [CHAINS_ENUM.KLAY]: '0xe4f05a66ec68b54a58b17c22107b02e0232cc817',
  [CHAINS_ENUM.GNOSIS]: '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d',
}

export const DEX_SUPPORT_CHAINS = {
  [DEX_ENUM.WRAPTOKEN]: wrapTokenSupportChains,
  [DEX_ENUM.ONEINCH]: oneInchSupportChains,
  [DEX_ENUM.PARASWAP]: paraswapSupportChains,
  [DEX_ENUM.ZEROXAPI]: zeroXSupportChains,
}

