import { CHAINS_ENUM } from "@debank/common";
import { SUPPORT_CHAINS as wrapTokenSupportChains } from "./dexs/wrapToken";
import { SUPPORT_CHAINS as zeroXSupportChains } from "./dexs/0xapi";
import { SUPPORT_CHAINS as oneInchSupportChains } from "./dexs/1inch";
import { SUPPORT_CHAINS as paraswapSupportChains } from "./dexs/paraswap";
import { SUPPORT_CHAINS as paraswapV6SupportChains } from "./dexs/paraswap_v6";
import { SUPPORT_CHAINS as kyberswapSupportChains } from "./dexs/kyberswap";
import { SUPPORT_CHAINS as openOceanSupportChains } from "./dexs/openocean";
import { SUPPORT_CHAINS as odosSupportChains } from "./dexs/odos";
import { SUPPORT_CHAINS as zeroXV2SupportChains } from "./dexs/0xapi_v2";
import { SUPPORT_CHAINS as magpieSupportChains } from "./dexs/magpie";
import { SUPPORT_CHAINS as rabbySupportChains } from "./dexs/rabby";

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
  [CHAINS_ENUM.CRO]: "0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23",
  [CHAINS_ENUM.LINEA]: "0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f",
  [CHAINS_ENUM.AURORA]: "0xc9bdeed33cd01541e1eed10f90519d2c06fe3feb",
  // [CHAINS_ENUM.BTT]: "0x23181f21dea5936e24163ffaba4ea3b316b57f3c",
  // [CHAINS_ENUM.ROSE]: "0x21c718c22d52d0f3a789b752d4c2fd5908a8a733",
  [CHAINS_ENUM.BASE]: "0x4200000000000000000000000000000000000006",
  [CHAINS_ENUM.ERA]: "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91",
  [CHAINS_ENUM.PZE]: "0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9",
  [CHAINS_ENUM.SCRL]: "0x5300000000000000000000000000000000000004",
  [CHAINS_ENUM.MANTLE]: "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8",
  [CHAINS_ENUM.MODE]: "0x4200000000000000000000000000000000000006",
  ["SONIC" as CHAINS_ENUM]: "0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38",
  [CHAINS_ENUM.BLAST]: "0x4300000000000000000000000000000000000004",
  [CHAINS_ENUM.METIS]: "0x75cb093e4d61d2a2e65d8e0bbb01de8d89b53481",
  [CHAINS_ENUM.MANTA]: "0x0dc808adce2099a9f62aa87d9670745aba741746",
  ["INK" as CHAINS_ENUM]: "0x4200000000000000000000000000000000000006",
  ["TAIKO" as CHAINS_ENUM]: "0xa51894664a773981c6c112c43ce576f315d5b1b6",
  ["BERA" as CHAINS_ENUM]: "0x6969696969696969696969696969696969696969",
  ["UNI" as CHAINS_ENUM]: "0x4200000000000000000000000000000000000006",
  ["RON" as CHAINS_ENUM]: "0xe514d9deb7966c8be0ca922de8a064264ea6bcd4",
};

export const DEX_SUPPORT_CHAINS = {
  [DEX_ENUM.WRAPTOKEN]: wrapTokenSupportChains,
  [DEX_ENUM.ONEINCH]: oneInchSupportChains,
  [DEX_ENUM.PARASWAP]: paraswapSupportChains,
  [DEX_ENUM.ZEROXAPI]: zeroXSupportChains,
  [DEX_ENUM.OPENOCEAN]: openOceanSupportChains,
  [DEX_ENUM.KYBERSWAP]: kyberswapSupportChains,
  [DEX_ENUM.PARASWAPV6]: paraswapV6SupportChains,
  [DEX_ENUM.ODOS]: odosSupportChains,
  [DEX_ENUM.ZEROXAPIV2]: zeroXV2SupportChains,
  [DEX_ENUM.MAGPIE]: magpieSupportChains,
  [DEX_ENUM.RABBY]: rabbySupportChains,
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
    [CHAINS_ENUM.LINEA]: "0x111111125421ca6dc452d289314280a0f8842a65",
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
    ["SONIC" as CHAINS_ENUM]: "0x6352a56caadc4f1e25cd6c75970fa768a3304e64",
    [CHAINS_ENUM.MANTLE]: "0x6352a56caadc4f1e25cd6c75970fa768a3304e64",
    ["BERA" as CHAINS_ENUM]: "0x6352a56caadc4f1e25cd6c75970fa768a3304e64",
    [CHAINS_ENUM.SCRL]: "0x6352a56caadc4f1e25cd6c75970fa768a3304e64",
    ["UNI" as CHAINS_ENUM]: "0x6352a56caadc4f1e25cd6c75970fa768a3304e64",
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
    ["SONIC" as CHAINS_ENUM]: "0x6131b5fae19ea4f9d964eac0408e4408b66337b5",
    [CHAINS_ENUM.MANTLE]: "0x6131b5fae19ea4f9d964eac0408e4408b66337b5",
    ["BERA" as CHAINS_ENUM]: "0x6131b5fae19ea4f9d964eac0408e4408b66337b5",
    [CHAINS_ENUM.ERA]: "0x3f95ef3f2eaca871858dbe20a93c01daf6c2e923",
    ["RON" as CHAINS_ENUM]: "0x6131b5fae19ea4f9d964eac0408e4408b66337b5",
    [CHAINS_ENUM.SCRL]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  },
  [DEX_ENUM.PARASWAPV6]: {
    [CHAINS_ENUM.ETH]: "0x6A000F20005980200259B80c5102003040001068",
    [CHAINS_ENUM.POLYGON]: "0x6A000F20005980200259B80c5102003040001068",
    [CHAINS_ENUM.BSC]: "0x6A000F20005980200259B80c5102003040001068",
    [CHAINS_ENUM.AVAX]: "0x6A000F20005980200259B80c5102003040001068",
    [CHAINS_ENUM.FTM]: "0x6A000F20005980200259B80c5102003040001068",
    [CHAINS_ENUM.OP]: "0x6A000F20005980200259B80c5102003040001068",
    [CHAINS_ENUM.ARBITRUM]: "0x6A000F20005980200259B80c5102003040001068",
    [CHAINS_ENUM.BASE]: "0x6A000F20005980200259B80c5102003040001068",
    [CHAINS_ENUM.PZE]: "0x6A000F20005980200259B80c5102003040001068",
    [CHAINS_ENUM.GNOSIS]: "0x6A000F20005980200259B80c5102003040001068",
  },
  [DEX_ENUM.ODOS]: {
    [CHAINS_ENUM.ETH]: "0xCf5540fFFCdC3d510B18bFcA6d2b9987b0772559",
    [CHAINS_ENUM.OP]: "0xCa423977156BB05b13A2BA3b76Bc5419E2fE9680",
    [CHAINS_ENUM.BSC]: "0x89b8AA89FDd0507a99d334CBe3C808fAFC7d850E",
    [CHAINS_ENUM.POLYGON]: "0x4E3288c9ca110bCC82bf38F09A7b425c095d92Bf",
    [CHAINS_ENUM.FTM]: "0xD0c22A5435F4E8E5770C1fAFb5374015FC12F7cD",
    [CHAINS_ENUM.ERA]: "0x4bBa932E9792A2b917D47830C93a9BC79320E4f7",
    [CHAINS_ENUM.MANTLE]: "0xD9F4e85489aDCD0bAF0Cd63b4231c6af58c26745",
    [CHAINS_ENUM.BASE]: "0x19cEeAd7105607Cd444F5ad10dd51356436095a1",
    [CHAINS_ENUM.ARBITRUM]: "0xa669e7A0d4b3e4Fa48af2dE86BD4CD7126Be4e13",
    [CHAINS_ENUM.AVAX]: "0x88de50B233052e4Fb783d4F6db78Cc34fEa3e9FC",
    [CHAINS_ENUM.LINEA]: "0x2d8879046f1559E53eb052E949e9544bCB72f414",
    [CHAINS_ENUM.SCRL]: "0xbFe03C9E20a9Fc0b37de01A172F207004935E0b1",
    [CHAINS_ENUM.MODE]: "0x7E15EB462cdc67Cf92Af1f7102465a8F8c784874",
  },
  [DEX_ENUM.ZEROXAPIV2]: {
    [CHAINS_ENUM.ETH]: "0x0000000000001ff3684f28c67538d4d072c22734",
    [CHAINS_ENUM.POLYGON]: "0x0000000000001ff3684f28c67538d4d072c22734",
    [CHAINS_ENUM.ARBITRUM]: "0x0000000000001ff3684f28c67538d4d072c22734",
    [CHAINS_ENUM.BASE]: "0x0000000000001ff3684f28c67538d4d072c22734",
    [CHAINS_ENUM.OP]: "0x0000000000001ff3684f28c67538d4d072c22734",
    [CHAINS_ENUM.BSC]: "0x0000000000001ff3684f28c67538d4d072c22734",
    [CHAINS_ENUM.AVAX]: "0x0000000000005e88410ccdfade4a5efae4b49562",
    ["BERA" as CHAINS_ENUM]: "0x0000000000001ff3684f28c67538d4d072c22734",
    ["UNI" as CHAINS_ENUM]: "0x0000000000001ff3684f28c67538d4d072c22734",
    [CHAINS_ENUM.SCRL]: "0x0000000000005e88410ccdfade4a5efae4b49562",
  },
  [DEX_ENUM.MAGPIE]: {
    [CHAINS_ENUM.ETH]: "0x15392211222b46a0ea85a9a800830486d144848d",
    [CHAINS_ENUM.OP]: "0x15392211222b46a0ea85a9a800830486d144848d",
    [CHAINS_ENUM.ARBITRUM]: "0x34cdce58cbdc6c54f2ac808a24561d0ab18ca8be",
    [CHAINS_ENUM.BSC]: "0x15392211222b46a0ea85a9a800830486d144848d",
    [CHAINS_ENUM.AVAX]: "0xf25075d95b5945bcff394588db3df8b1cacfccf6",
    [CHAINS_ENUM.FTM]: "0x2b14763c27b9661182c2503f6c9c4d47ba747dd2",
    [CHAINS_ENUM.POLYGON]: "0x15392211222b46a0ea85a9a800830486d144848d",
    [CHAINS_ENUM.BASE]: "0xef42f78d25f4c681dcad2597fa04877ff802ef4b",
    [CHAINS_ENUM.PZE]: "0xcf32c5bb41f7a302298a2d2072155800871baad3",
    ["SONIC" as CHAINS_ENUM]: "0xba7bac71a8ee550d89b827fe6d67bc3dca07b104",
    [CHAINS_ENUM.BLAST]: "0x5affa5312ade198d9527acf058fee1c8ed8fe9f3",
    [CHAINS_ENUM.MANTA]: "0x5affa5312ade198d9527acf058fee1c8ed8fe9f3",
    [CHAINS_ENUM.METIS]: "0x2b14763c27b9661182c2503f6c9c4d47ba747dd2",
    [CHAINS_ENUM.SCRL]: "0x52bebb970697476313ae2b3383f40d4afd4ad9d3",
    [CHAINS_ENUM.ERA]: "0x38ae1164ca61ee7aa395bb139b3990e347988ce1",
    ["TAIKO" as CHAINS_ENUM]: "0x2b14763c27b9661182c2503f6c9c4d47ba747dd2",
    ["INK" as CHAINS_ENUM]: "0xba7bAC71a8Ee550d89B827FE6d67bc3dCA07b104",
    ["BERA" as CHAINS_ENUM]: "0xba7bAC71a8Ee550d89B827FE6d67bc3dCA07b104",
    [CHAINS_ENUM.LINEA]: "0xba7bAC71a8Ee550d89B827FE6d67bc3dCA07b104",
  },
  [DEX_ENUM.RABBY]: {
    [CHAINS_ENUM.ETH]: "0x7fd9cfeef127451918c688c49e9905e47da3e985",
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
    [CHAINS_ENUM.LINEA]: "0x111111125421ca6dc452d289314280a0f8842a65",
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
    [CHAINS_ENUM.PZE]: "0xc8a21fcd5a100c3ecc037c97e2f9c53a8d3a02a1",
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
    ["SONIC" as CHAINS_ENUM]: "0x6352a56caadc4f1e25cd6c75970fa768a3304e64",
    [CHAINS_ENUM.MANTLE]: "0x6352a56caadc4f1e25cd6c75970fa768a3304e64",
    ["BERA" as CHAINS_ENUM]: "0x6352a56caadc4f1e25cd6c75970fa768a3304e64",
    [CHAINS_ENUM.SCRL]: "0x6352a56caadc4f1e25cd6c75970fa768a3304e64",
    ["UNI" as CHAINS_ENUM]: "0x6352a56caadc4f1e25cd6c75970fa768a3304e64",
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
    ["SONIC" as CHAINS_ENUM]: "0x6131b5fae19ea4f9d964eac0408e4408b66337b5",
    [CHAINS_ENUM.MANTLE]: "0x6131b5fae19ea4f9d964eac0408e4408b66337b5",
    ["BERA" as CHAINS_ENUM]: "0x6131b5fae19ea4f9d964eac0408e4408b66337b5",
    [CHAINS_ENUM.ERA]: "0x3f95ef3f2eaca871858dbe20a93c01daf6c2e923",
    ["RON" as CHAINS_ENUM]: "0x6131b5fae19ea4f9d964eac0408e4408b66337b5",
    [CHAINS_ENUM.SCRL]: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  },
  [DEX_ENUM.PARASWAPV6]: {
    [CHAINS_ENUM.ETH]: "0x6A000F20005980200259B80c5102003040001068",
    [CHAINS_ENUM.POLYGON]: "0x6A000F20005980200259B80c5102003040001068",
    [CHAINS_ENUM.BSC]: "0x6A000F20005980200259B80c5102003040001068",
    [CHAINS_ENUM.AVAX]: "0x6A000F20005980200259B80c5102003040001068",
    [CHAINS_ENUM.FTM]: "0x6A000F20005980200259B80c5102003040001068",
    [CHAINS_ENUM.OP]: "0x6A000F20005980200259B80c5102003040001068",
    [CHAINS_ENUM.ARBITRUM]: "0x6A000F20005980200259B80c5102003040001068",
    [CHAINS_ENUM.BASE]: "0x6A000F20005980200259B80c5102003040001068",
    [CHAINS_ENUM.PZE]: "0x6A000F20005980200259B80c5102003040001068",
    [CHAINS_ENUM.GNOSIS]: "0x6A000F20005980200259B80c5102003040001068",
  },
  [DEX_ENUM.ODOS]: {
    [CHAINS_ENUM.ETH]: "0xCf5540fFFCdC3d510B18bFcA6d2b9987b0772559",
    [CHAINS_ENUM.OP]: "0xCa423977156BB05b13A2BA3b76Bc5419E2fE9680",
    [CHAINS_ENUM.BSC]: "0x89b8AA89FDd0507a99d334CBe3C808fAFC7d850E",
    [CHAINS_ENUM.POLYGON]: "0x4E3288c9ca110bCC82bf38F09A7b425c095d92Bf",
    [CHAINS_ENUM.FTM]: "0xD0c22A5435F4E8E5770C1fAFb5374015FC12F7cD",
    [CHAINS_ENUM.ERA]: "0x4bBa932E9792A2b917D47830C93a9BC79320E4f7",
    [CHAINS_ENUM.MANTLE]: "0xD9F4e85489aDCD0bAF0Cd63b4231c6af58c26745",
    [CHAINS_ENUM.BASE]: "0x19cEeAd7105607Cd444F5ad10dd51356436095a1",
    [CHAINS_ENUM.ARBITRUM]: "0xa669e7A0d4b3e4Fa48af2dE86BD4CD7126Be4e13",
    [CHAINS_ENUM.AVAX]: "0x88de50B233052e4Fb783d4F6db78Cc34fEa3e9FC",
    [CHAINS_ENUM.LINEA]: "0x2d8879046f1559E53eb052E949e9544bCB72f414",
    [CHAINS_ENUM.SCRL]: "0xbFe03C9E20a9Fc0b37de01A172F207004935E0b1",
    [CHAINS_ENUM.MODE]: "0x7E15EB462cdc67Cf92Af1f7102465a8F8c784874",
  },
  [DEX_ENUM.ZEROXAPIV2]: {
    [CHAINS_ENUM.ETH]: "0x0000000000001ff3684f28c67538d4d072c22734",
    [CHAINS_ENUM.POLYGON]: "0x0000000000001ff3684f28c67538d4d072c22734",
    [CHAINS_ENUM.ARBITRUM]: "0x0000000000001ff3684f28c67538d4d072c22734",
    [CHAINS_ENUM.BASE]: "0x0000000000001ff3684f28c67538d4d072c22734",
    [CHAINS_ENUM.OP]: "0x0000000000001ff3684f28c67538d4d072c22734",
    [CHAINS_ENUM.BSC]: "0x0000000000001ff3684f28c67538d4d072c22734",
    [CHAINS_ENUM.AVAX]: "0x0000000000005e88410ccdfade4a5efae4b49562",
    ["BERA" as CHAINS_ENUM]: "0x0000000000001ff3684f28c67538d4d072c22734",
    ["UNI" as CHAINS_ENUM]: "0x0000000000001ff3684f28c67538d4d072c22734",
    [CHAINS_ENUM.SCRL]: "0x0000000000005e88410ccdfade4a5efae4b49562",
  },
  [DEX_ENUM.MAGPIE]: {
    [CHAINS_ENUM.ETH]: "0x15392211222b46a0ea85a9a800830486d144848d",
    [CHAINS_ENUM.OP]: "0x15392211222b46a0ea85a9a800830486d144848d",
    [CHAINS_ENUM.ARBITRUM]: "0x34cdce58cbdc6c54f2ac808a24561d0ab18ca8be",
    [CHAINS_ENUM.BSC]: "0x15392211222b46a0ea85a9a800830486d144848d",
    [CHAINS_ENUM.AVAX]: "0xf25075d95b5945bcff394588db3df8b1cacfccf6",
    [CHAINS_ENUM.FTM]: "0x2b14763c27b9661182c2503f6c9c4d47ba747dd2",
    [CHAINS_ENUM.POLYGON]: "0x15392211222b46a0ea85a9a800830486d144848d",
    [CHAINS_ENUM.BASE]: "0xef42f78d25f4c681dcad2597fa04877ff802ef4b",
    [CHAINS_ENUM.PZE]: "0xcf32c5bb41f7a302298a2d2072155800871baad3",
    ["SONIC" as CHAINS_ENUM]: "0xba7bac71a8ee550d89b827fe6d67bc3dca07b104",
    [CHAINS_ENUM.BLAST]: "0x5affa5312ade198d9527acf058fee1c8ed8fe9f3",
    [CHAINS_ENUM.MANTA]: "0x5affa5312ade198d9527acf058fee1c8ed8fe9f3",
    [CHAINS_ENUM.METIS]: "0x2b14763c27b9661182c2503f6c9c4d47ba747dd2",
    [CHAINS_ENUM.SCRL]: "0x52bebb970697476313ae2b3383f40d4afd4ad9d3",
    [CHAINS_ENUM.ERA]: "0x38ae1164ca61ee7aa395bb139b3990e347988ce1",
    ["TAIKO" as CHAINS_ENUM]: "0x2b14763c27b9661182c2503f6c9c4d47ba747dd2",
    ["INK" as CHAINS_ENUM]: "0xba7bAC71a8Ee550d89B827FE6d67bc3dCA07b104",
    ["BERA" as CHAINS_ENUM]: "0xba7bAC71a8Ee550d89B827FE6d67bc3dCA07b104",
    [CHAINS_ENUM.LINEA]: "0xba7bAC71a8Ee550d89B827FE6d67bc3dCA07b104",
  },
  [DEX_ENUM.RABBY]: {
    [CHAINS_ENUM.ETH]: "0x7fd9cfeef127451918c688c49e9905e47da3e985",
  },
};
