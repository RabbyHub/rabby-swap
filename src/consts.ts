import { CHAINS_ENUM } from "@debank/common";
import { SUPPORT_CHAINS as wrapTokenSupportChains } from "./dexs/wrapToken";
import { SUPPORT_CHAINS as zeroXSupportChains } from "./dexs/0xapi";
import { SUPPORT_CHAINS as oneInchSupportChains } from "./dexs/1inch";
import { SUPPORT_CHAINS as paraswapSupportChains } from "./dexs/paraswap";
import { SUPPORT_CHAINS as openOceanSupportChains } from "./dexs/openocean";
import { SUPPORT_CHAINS as uniswapSupportChains } from "./dexs/uniswap";

export enum DEX_ENUM {
  ONEINCH = "1inch",
  PARASWAP = "ParaSwap",
  ZEROXAPI = "0xAPI",
  WRAPTOKEN = "WrapToken",
  OPENOCEAN = "OpenOcean",
  UNISWAP = "Uniswap",
}

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
};

export const DEX_SUPPORT_CHAINS = {
  [DEX_ENUM.WRAPTOKEN]: wrapTokenSupportChains,
  [DEX_ENUM.ONEINCH]: oneInchSupportChains,
  [DEX_ENUM.PARASWAP]: paraswapSupportChains,
  [DEX_ENUM.ZEROXAPI]: zeroXSupportChains,
  [DEX_ENUM.OPENOCEAN]: openOceanSupportChains,
  [DEX_ENUM.UNISWAP]: uniswapSupportChains,
};

export const DEX_ROUTER_WHITELIST = {
  [DEX_ENUM.ONEINCH]: {
    [CHAINS_ENUM.ETH]: "0x1111111254eeb25477b68fb85ed929f73a960582",
    [CHAINS_ENUM.POLYGON]: "0x1111111254eeb25477b68fb85ed929f73a960582",
    [CHAINS_ENUM.BSC]: "0x1111111254eeb25477b68fb85ed929f73a960582",
    [CHAINS_ENUM.OP]: "0x1111111254eeb25477b68fb85ed929f73a960582",
    [CHAINS_ENUM.FTM]: "0x1111111254eeb25477b68fb85ed929f73a960582",
    [CHAINS_ENUM.AVAX]: "0x1111111254eeb25477b68fb85ed929f73a960582",
    [CHAINS_ENUM.ARBITRUM]: "0x1111111254eeb25477b68fb85ed929f73a960582",
    [CHAINS_ENUM.KLAY]: "0x1111111254eeb25477b68fb85ed929f73a960582",
    [CHAINS_ENUM.GNOSIS]: "0x1111111254eeb25477b68fb85ed929f73a960582",
    [CHAINS_ENUM.CELO]: "0x1111111254eeb25477b68fb85ed929f73a960582",
  },
  [DEX_ENUM.PARASWAP]: {
    [CHAINS_ENUM.ETH]: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
    [CHAINS_ENUM.POLYGON]: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
    [CHAINS_ENUM.BSC]: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
    [CHAINS_ENUM.AVAX]: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
    [CHAINS_ENUM.FTM]: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
    [CHAINS_ENUM.ARBITRUM]: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
    [CHAINS_ENUM.OP]: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
  },
  [DEX_ENUM.ZEROXAPI]: {
    [CHAINS_ENUM.ETH]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.POLYGON]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.BSC]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.OP]: "0xdef1abe32c034e558cdd535791643c58a13acc10",
    [CHAINS_ENUM.FTM]: "0xdef189deaef76e379df891899eb5a00a94cbc250",
    [CHAINS_ENUM.CELO]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.AVAX]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.ARBITRUM]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
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
  },
  [DEX_ENUM.UNISWAP]: {
    [CHAINS_ENUM.ETH]: "0xe592427a0aece92de3edee1f18e0157c05861564",
    [CHAINS_ENUM.POLYGON]: "0xe592427a0aece92de3edee1f18e0157c05861564",
    [CHAINS_ENUM.BSC]: "0xe592427a0aece92de3edee1f18e0157c05861564",
    [CHAINS_ENUM.OP]: "0xe592427a0aece92de3edee1f18e0157c05861564",
    [CHAINS_ENUM.ARBITRUM]: "0xe592427a0aece92de3edee1f18e0157c05861564",
  },
};

export const DEX_SPENDER_WHITELIST = {
  [DEX_ENUM.ONEINCH]: {
    [CHAINS_ENUM.ETH]: "0x1111111254eeb25477b68fb85ed929f73a960582",
    [CHAINS_ENUM.POLYGON]: "0x1111111254eeb25477b68fb85ed929f73a960582",
    [CHAINS_ENUM.BSC]: "0x1111111254eeb25477b68fb85ed929f73a960582",
    [CHAINS_ENUM.OP]: "0x1111111254eeb25477b68fb85ed929f73a960582",
    [CHAINS_ENUM.FTM]: "0x1111111254eeb25477b68fb85ed929f73a960582",
    [CHAINS_ENUM.AVAX]: "0x1111111254eeb25477b68fb85ed929f73a960582",
    [CHAINS_ENUM.ARBITRUM]: "0x1111111254eeb25477b68fb85ed929f73a960582",
    [CHAINS_ENUM.KLAY]: "0x1111111254eeb25477b68fb85ed929f73a960582",
    [CHAINS_ENUM.GNOSIS]: "0x1111111254eeb25477b68fb85ed929f73a960582",
    [CHAINS_ENUM.CELO]: "0x1111111254eeb25477b68fb85ed929f73a960582",
  },
  [DEX_ENUM.PARASWAP]: {
    [CHAINS_ENUM.ETH]: "0x216b4b4ba9f3e719726886d34a177484278bfcae",
    [CHAINS_ENUM.POLYGON]: "0x216b4b4ba9f3e719726886d34a177484278bfcae",
    [CHAINS_ENUM.BSC]: "0x216b4b4ba9f3e719726886d34a177484278bfcae",
    [CHAINS_ENUM.AVAX]: "0x216b4b4ba9f3e719726886d34a177484278bfcae",
    [CHAINS_ENUM.FTM]: "0x216b4b4ba9f3e719726886d34a177484278bfcae",
    [CHAINS_ENUM.OP]: "0x216b4b4ba9f3e719726886d34a177484278bfcae",
    [CHAINS_ENUM.ARBITRUM]: "0x216b4b4ba9f3e719726886d34a177484278bfcae",
  },
  [DEX_ENUM.ZEROXAPI]: {
    [CHAINS_ENUM.ETH]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.POLYGON]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.BSC]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.OP]: "0xdef1abe32c034e558cdd535791643c58a13acc10",
    [CHAINS_ENUM.FTM]: "0xdef189deaef76e379df891899eb5a00a94cbc250",
    [CHAINS_ENUM.CELO]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.AVAX]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    [CHAINS_ENUM.ARBITRUM]: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
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
  },

  [DEX_ENUM.UNISWAP]: {
    [CHAINS_ENUM.ETH]: "0xe592427a0aece92de3edee1f18e0157c05861564",
    [CHAINS_ENUM.POLYGON]: "0xe592427a0aece92de3edee1f18e0157c05861564",
    [CHAINS_ENUM.BSC]: "0xe592427a0aece92de3edee1f18e0157c05861564",
    [CHAINS_ENUM.OP]: "0xe592427a0aece92de3edee1f18e0157c05861564",
    [CHAINS_ENUM.ARBITRUM]: "0xe592427a0aece92de3edee1f18e0157c05861564",
  },
};
