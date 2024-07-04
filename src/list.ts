import { CHAINS_ENUM } from "@debank/common";
import { SUPPORT_CHAINS as wrapTokenSupportChains } from "./dexs/wrapToken";
import { SUPPORT_CHAINS as zeroXSupportChains } from "./dexs/0xapi";
import { SUPPORT_CHAINS as oneInchSupportChains } from "./dexs/1inch";
import { SUPPORT_CHAINS as paraswapSupportChains } from "./dexs/paraswap";
import { SUPPORT_CHAINS as kyberswapSupportChains } from "./dexs/kyberswap";
import { SUPPORT_CHAINS as openOceanSupportChains } from "./dexs/openocean";

import { DEX_ENUM } from "./consts";

export const WrapTokenAddressMap = {
  [CHAINS_ENUM.ETH]: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  [CHAINS_ENUM.BSC]: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  [CHAINS_ENUM.POLYGON]: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
  [CHAINS_ENUM.OP]: "0x4200000000000000000000000000000000000006",
  [CHAINS_ENUM.FTM]: "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83",
  [CHAINS_ENUM.AVAX]: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
  [CHAINS_ENUM.ARBITRUM]: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  [CHAINS_ENUM.KLAY]: "0xe4f05a66ec68b54a58b17c22107b02e0232cc817",
  [CHAINS_ENUM.GNOSIS]: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
  // [CHAINS_ENUM.CRO]: "0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23",
  // [CHAINS_ENUM.LINEA]: "0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f",
  [CHAINS_ENUM.AURORA]: "0xc9bdeed33cd01541e1eed10f90519d2c06fe3feb",
  // [CHAINS_ENUM.BTT]: "0x23181f21dea5936e24163ffaba4ea3b316b57f3c",
  // [CHAINS_ENUM.ROSE]: "0x21c718c22d52d0f3a789b752d4c2fd5908a8a733",
  [CHAINS_ENUM.BASE]: "0x4200000000000000000000000000000000000006",
  [CHAINS_ENUM.ERA]: "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91",
  // [CHAINS_ENUM.PZE]: "0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9",
};

export const DEX_SUPPORT_CHAINS = {
  [DEX_ENUM.WRAPTOKEN]: wrapTokenSupportChains,
  [DEX_ENUM.ONEINCH]: oneInchSupportChains,
  [DEX_ENUM.PARASWAP]: paraswapSupportChains,
  [DEX_ENUM.ZEROXAPI]: zeroXSupportChains,
  [DEX_ENUM.OPENOCEAN]: openOceanSupportChains,
  [DEX_ENUM.KYBERSWAP]: kyberswapSupportChains,
};

export const DEX_ROUTER_WHITELIST = {
  [DEX_ENUM.ONEINCH]: {
    [CHAINS_ENUM.ETH]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.POLYGON]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.BSC]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.OP]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.FTM]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.AVAX]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.ARBITRUM]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.KLAY]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.GNOSIS]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.BASE]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.ERA]: "0x6fd4383cb451173d5f9304f041c7bcbf27d561ff",
    [CHAINS_ENUM.AURORA]: "0x111111125421ca6dc452d289314280a0f8842a65",
  },
  [DEX_ENUM.PARASWAP]: {
    [CHAINS_ENUM.ETH]: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
    [CHAINS_ENUM.POLYGON]: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
    [CHAINS_ENUM.BSC]: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
    [CHAINS_ENUM.AVAX]: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
    [CHAINS_ENUM.FTM]: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
    [CHAINS_ENUM.ARBITRUM]: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
    [CHAINS_ENUM.OP]: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
    [CHAINS_ENUM.BASE]: "0x59C7C832e96D2568bea6db468C1aAdcbbDa08A52",
  },
  [DEX_ENUM.ZEROXAPI]: {
    [CHAINS_ENUM.ETH]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.POLYGON]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.BSC]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.OP]: "0xdef1abe32c034e558cdd535791643c58a13acc10",
    [CHAINS_ENUM.FTM]: "0xdef189deaef76e379df891899eb5a00a94cbc250",
    [CHAINS_ENUM.AVAX]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.ARBITRUM]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.BASE]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
  },
  [DEX_ENUM.OPENOCEAN]: {
    [CHAINS_ENUM.ETH]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.POLYGON]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.BSC]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.OP]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.FTM]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.AVAX]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.ARBITRUM]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.CRO]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.GNOSIS]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.AURORA]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.BOBA]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.KAVA]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.METIS]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.BASE]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
  },
  [DEX_ENUM.KYBERSWAP]: {
    [CHAINS_ENUM.ETH]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.POLYGON]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.OP]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.ARBITRUM]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.BSC]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.AVAX]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.FTM]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.CRO]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.AURORA]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.BTT]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.ROSE]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.LINEA]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.BASE]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  },
};

export const DEX_SPENDER_WHITELIST = {
  [DEX_ENUM.ONEINCH]: {
    [CHAINS_ENUM.ETH]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.POLYGON]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.BSC]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.OP]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.FTM]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.AVAX]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.ARBITRUM]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.KLAY]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.GNOSIS]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.BASE]: "0x111111125421ca6dc452d289314280a0f8842a65",
    [CHAINS_ENUM.ERA]: "0x6fd4383cb451173d5f9304f041c7bcbf27d561ff",
    [CHAINS_ENUM.AURORA]: "0x111111125421ca6dc452d289314280a0f8842a65",
  },
  [DEX_ENUM.PARASWAP]: {
    [CHAINS_ENUM.ETH]: "0x216b4b4ba9f3e719726886d34a177484278bfcae",
    [CHAINS_ENUM.POLYGON]: "0x216b4b4ba9f3e719726886d34a177484278bfcae",
    [CHAINS_ENUM.BSC]: "0x216b4b4ba9f3e719726886d34a177484278bfcae",
    [CHAINS_ENUM.AVAX]: "0x216b4b4ba9f3e719726886d34a177484278bfcae",
    [CHAINS_ENUM.FTM]: "0x216b4b4ba9f3e719726886d34a177484278bfcae",
    [CHAINS_ENUM.OP]: "0x216b4b4ba9f3e719726886d34a177484278bfcae",
    [CHAINS_ENUM.ARBITRUM]: "0x216b4b4ba9f3e719726886d34a177484278bfcae",
    [CHAINS_ENUM.BASE]: "0x93aAAe79a53759cD164340E4C8766E4Db5331cD7",
    // [CHAINS_ENUM.PZE]: "0xc8a21fcd5a100c3ecc037c97e2f9c53a8d3a02a1",
  },
  [DEX_ENUM.ZEROXAPI]: {
    [CHAINS_ENUM.ETH]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.POLYGON]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.BSC]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.OP]: "0xdef1abe32c034e558cdd535791643c58a13acc10",
    [CHAINS_ENUM.FTM]: "0xdef189deaef76e379df891899eb5a00a94cbc250",
    [CHAINS_ENUM.AVAX]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.ARBITRUM]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.BASE]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
  },
  [DEX_ENUM.OPENOCEAN]: {
    [CHAINS_ENUM.ETH]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.POLYGON]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.BSC]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.OP]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.FTM]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.AVAX]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.ARBITRUM]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.CRO]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.GNOSIS]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.AURORA]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.BOBA]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.KAVA]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.METIS]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    [CHAINS_ENUM.BASE]: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
  },
  [DEX_ENUM.KYBERSWAP]: {
    [CHAINS_ENUM.ETH]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.POLYGON]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.OP]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.ARBITRUM]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.BSC]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.AVAX]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.FTM]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.CRO]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.AURORA]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.BTT]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.ROSE]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.LINEA]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    [CHAINS_ENUM.BASE]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  },
};
