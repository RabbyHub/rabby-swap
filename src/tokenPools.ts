export interface TokenPoolLookupToken {
  chain: string;
  id: string;
}

export type TokenPoolToken = TokenPoolLookupToken;

/**
 * Well-known stablecoins on supported swap chains.
 *
 * Token ids use the same representation as Rabby TokenItem.id, and chain values
 * use DeBank server ids (for example: eth, arb, matic).
 */
export const STABLE_TOKEN_POOL: readonly TokenPoolToken[] = [
  { chain: "abs", id: "0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1" }, // USDC.e
  { chain: "abs", id: "0x0709F39376dEEe2A2dfC94A58EdEb2Eb9DF012bD" }, // USDT
  { chain: "arb", id: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" }, // DAI
  { chain: "arb", id: "0x46850aD61C2B7d64d08c9C754F45254596696984" }, // PYUSD
  { chain: "arb", id: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8" }, // USDC.e
  { chain: "arb", id: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" }, // USDC
  { chain: "arb", id: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" }, // USDe
  { chain: "arb", id: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" }, // USDT0
  { chain: "aurora", id: "0xB12BFcA5A55806AaF64E99521918A4bf0fC40802" }, // USDC
  { chain: "aurora", id: "0x4988a896b1227218e4A686fdE5EabdcAbd91571f" }, // USDT
  { chain: "avax", id: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70" }, // DAI.e
  { chain: "avax", id: "0xC891EB4cbdEFf6e073e859e987815Ed1505c2ACD" }, // EURC
  { chain: "avax", id: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E" }, // USDC
  { chain: "avax", id: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7" }, // USDt
  { chain: "base", id: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb" }, // DAI
  { chain: "base", id: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42" }, // EURC
  { chain: "base", id: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA" }, // USDbC
  { chain: "base", id: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" }, // USDC
  { chain: "base", id: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" }, // USDe
  { chain: "base", id: "0x820C137fa70C8691f0e44Dc420a5e53c168921Dc" }, // USDS
  { chain: "base", id: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2" }, // USDT
  { chain: "bera", id: "0x549943e04f40284185054145c6E4e9568C1D3241" }, // USDC.e
  { chain: "bera", id: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" }, // USDe
  { chain: "blast", id: "0x4300000000000000000000000000000000000003" }, // USDB
  { chain: "blast", id: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" }, // USDe
  { chain: "bsc", id: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3" }, // DAI
  { chain: "bsc", id: "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409" }, // FDUSD
  { chain: "bsc", id: "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d" }, // USD1
  { chain: "bsc", id: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" }, // USDC
  { chain: "bsc", id: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" }, // USDe
  { chain: "bsc", id: "0x55d398326f99059fF775485246999027B3197955" }, // USDT
  { chain: "celo", id: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" }, // USDC
  { chain: "celo", id: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" }, // USDT
  { chain: "core", id: "0xa4151B2B3e269645181dCcF2D426cE75fcbDeca9" }, // USDC
  { chain: "core", id: "0x900101d06a7426441ae63e9ab3b9b0f63be145f1" }, // USDT
  { chain: "cro", id: "0x3D7F2C478aAfdB65542BCB44bCeeC05849999d2D" }, // USDC
  { chain: "cro", id: "0x66e428c3f67a68878562e79A0234c1F83c208770" }, // USDT
  { chain: "era", id: "0x4B9eb6c0b6ea15176BBF62841C6B2A8a398cb656" }, // DAI
  { chain: "era", id: "0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4" }, // USDC
  { chain: "era", id: "0x39Fe7a0DACcE31Bd90418e3e659fb0b5f0B3Db0d" }, // USDe
  { chain: "era", id: "0x493257fD37EDB34451f62EDf8D2a0C418852bA4C" }, // USDT
  { chain: "eth", id: "0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E" }, // crvUSD
  { chain: "eth", id: "0x6B175474E89094C44Da98b954EedeAC495271d0F" }, // DAI
  { chain: "eth", id: "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c" }, // EURC
  { chain: "eth", id: "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409" }, // FDUSD
  { chain: "eth", id: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8" }, // PYUSD
  { chain: "eth", id: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" }, // USDC
  { chain: "eth", id: "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3" }, // USDe
  { chain: "eth", id: "0xdC035D45d973E3EC169d2276DDab16f1e407384F" }, // USDS
  { chain: "eth", id: "0xdAC17F958D2ee523a2206206994597C13D831ec7" }, // USDT
  { chain: "eth", id: "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d" }, // USD1
  { chain: "gravity", id: "0xFbDa5F676cB37624f28265A144A48B0d6e87d3b6" }, // USDC.e
  { chain: "gravity", id: "0x816E810f9F787d669FB71932DeabF6c83781Cd48" }, // USDT
  { chain: "hood", id: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168" }, // USDG
  { chain: "hyper", id: "0xb88339CB7199b77E23DB6E890353E22632Ba630f" }, // USDC
  { chain: "hyper", id: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" }, // USDe
  { chain: "hyper", id: "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb" }, // USDT0
  { chain: "ink", id: "0x2D270e6886d130D724215A266106e6832161EAEd" }, // USDC
  { chain: "ink", id: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" }, // USDe
  { chain: "ink", id: "0x0200C29006150606B650577BBE7B6248F58470c1" }, // USDT0
  { chain: "kava", id: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" }, // USDe
  { chain: "kava", id: "0x919C1c267BC06a7039e03fcc2eF738525769109c" }, // USDT
  { chain: "klay", id: "0xd077A400968890Eacc75cdc901F0356c943e4fDb" }, // USDT
  { chain: "linea", id: "0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5" }, // DAI
  { chain: "linea", id: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff" }, // USDC
  { chain: "linea", id: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" }, // USDe
  { chain: "linea", id: "0xA219439258ca9da29E9Cc4cE5596924745e12B93" }, // USDT
  { chain: "manta", id: "0xb73603C5d87fA094B7314C74ACE2e64D165016fb" }, // USDC
  { chain: "manta", id: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" }, // USDe
  { chain: "manta", id: "0xf417F5A458eC102B90352F697D6e2Ac3A3d2851f" }, // USDT
  { chain: "matic", id: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063" }, // DAI
  { chain: "matic", id: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" }, // USDC.e
  { chain: "matic", id: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" }, // USDC
  { chain: "matic", id: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" }, // USDT
  { chain: "megaeth", id: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" }, // USDe
  { chain: "megaeth", id: "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb" }, // USDT0
  { chain: "metis", id: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" }, // USDe
  { chain: "mnt", id: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9" }, // USDC
  { chain: "mnt", id: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" }, // USDe
  { chain: "mnt", id: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE" }, // USDT
  { chain: "mnt", id: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736" }, // USDT0
  { chain: "mnt", id: "0x111111d2bf19e43c34263401e0cad979ed1cdb61" }, // USD1
  { chain: "mode", id: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" }, // USDe
  { chain: "monad", id: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603" }, // USDC
  { chain: "monad", id: "0xe7cd86e13AC4309349F30B3435a9d337750fC82D" }, // USDT0
  { chain: "monad", id: "0x111111d2bf19e43c34263401e0cad979ed1cdb61" }, // USD1
  { chain: "op", id: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" }, // DAI
  { chain: "op", id: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" }, // USDC
  { chain: "op", id: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" }, // USDe
  { chain: "op", id: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58" }, // USDT
  { chain: "op", id: "0x01bFF41798a0BcF287b996046Ca68b395DbC1071" }, // USDT0
  { chain: "plasma", id: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" }, // USDe
  { chain: "plasma", id: "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb" }, // USDT0
  { chain: "pze", id: "0xC5015b9d9161Dca7e18e32f6f25C4aD850731Fd4" }, // DAI
  { chain: "pze", id: "0xA8CE8aee21bc2A48a5EF670Afcc9274C7bbBc035" }, // USDC
  { chain: "pze", id: "0x1E4a5963aBfD975d8c9021ce480b42188849D41d" }, // USDT
  { chain: "ron", id: "0x0B7007c13325C48911F73A2daD5FA5dCBf808aDc" }, // USDC
  { chain: "rsk", id: "0x74c9f2b00581F1B11AA7ff05aa9F608B7389De67" }, // USDC.e
  { chain: "rsk", id: "0xAf368c91793CB22739386DFCbBb2F1A9e4bCBeBf" }, // USDT
  { chain: "scrl", id: "0xcA77eB3fEFe3725Dc33bccB54eDEFc3D9f764f97" }, // DAI
  { chain: "scrl", id: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4" }, // USDC
  { chain: "scrl", id: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" }, // USDe
  { chain: "scrl", id: "0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df" }, // USDT
  { chain: "sei", id: "0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392" }, // USDC
  { chain: "sonic", id: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894" }, // USDC
  { chain: "sonic", id: "0x6047828dc181963ba44974801FF68e538dA5eaF9" }, // USDT
  { chain: "stable", id: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736" }, // USDT0
  { chain: "tempo", id: "0x20c0000000000000000000003554d28269e0f3c2" }, // frxUSD
  { chain: "tempo", id: "0x20c0000000000000000000000000000000000000" }, // USD
  { chain: "tempo", id: "0x20c000000000000000000000b9537d11c60e8b50" }, // USDC.e
  { chain: "tempo", id: "0x20c00000000000000000000014f22ca97301eb73" }, // USDT0
  { chain: "uni", id: "0x078D782b760474a361dDA0AF3839290b0EF57AD6" }, // USDC
  { chain: "uni", id: "0x9151434b16b9763660705744891fA906F660EcC5" }, // USDT0
  { chain: "xdai", id: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83" }, // USDC
  { chain: "xdai", id: "0x4ECaBa5870353805a9F068101A40E0f32ed605C6" }, // USDT
  { chain: "xlayer", id: "0x74b7F16337b8972027F6196A17a631aC6dE26d22" }, // USDC
  { chain: "xlayer", id: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" }, // USDe
  { chain: "xlayer", id: "0x111111d2bf19e43c34263401e0cad979ed1cdb61" }, // USD1
];

/**
 * Native-equivalent and derivative tokens.
 *
 * Any two tokens in this pool form a same-type pair on the same chain.
 */
const ETH_NATIVE_TOKEN: TokenPoolToken = { chain: "eth", id: "eth" }; // ETH
const ETH_WRAPPED_NATIVE_TOKEN: TokenPoolToken = {
  chain: "eth",
  id: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
}; // WETH

export const NATIVE_AND_DERIVATIVE_TOKEN_POOL: readonly TokenPoolToken[] = [
  ETH_NATIVE_TOKEN,
  ETH_WRAPPED_NATIVE_TOKEN,
  { chain: "eth", id: "0xE95A203B1a91a908F9B9CE46459d101078c2c3cb" }, // ankrETH
  { chain: "eth", id: "0xBe9895146f7AF43049ca1c1AE358B0541Ea49704" }, // cbETH
  { chain: "eth", id: "0xbf5495Efe5DB9ce00f80364C8B423567e58d2110" }, // ezETH
  { chain: "eth", id: "0x5E8422345238F34275888049021821E8E08CAa1f" }, // frxETH
  { chain: "eth", id: "0xD9A442856C234a39a81a089C06451EBAa4306a72" }, // pufETH
  { chain: "eth", id: "0xae78736Cd615f374D3085123A210448E74Fc6393" }, // rETH
  { chain: "eth", id: "0xac3E018457B222d93114458476f3E3416Abbe38F" }, // sfrxETH
  { chain: "eth", id: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84" }, // stETH
  { chain: "eth", id: "0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee" }, // weETH
  { chain: "eth", id: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0" }, // wstETH
];

const TOKEN_KEY_SEPARATOR = ":";

const isTokenPoolLookupToken = (
  token: TokenPoolLookupToken | null | undefined
): token is TokenPoolLookupToken =>
  !!token &&
  typeof token.chain === "string" &&
  token.chain.length > 0 &&
  typeof token.id === "string" &&
  token.id.length > 0;

const getTokenKey = (token: TokenPoolLookupToken) =>
  `${token.chain.toLowerCase()}${TOKEN_KEY_SEPARATOR}${token.id.toLowerCase()}`;

const stableTokenKeySet = new Set(STABLE_TOKEN_POOL.map(getTokenKey));

const nativeAndDerivativeTokenKeySet = new Set(
  NATIVE_AND_DERIVATIVE_TOKEN_POOL.map(getTokenKey)
);

/**
 * Returns true when both tokens form a same-type pair in the same pool:
 * either two stablecoins, or two native/derivative tokens.
 *
 * Lookup is O(1) after module initialization. Tokens from different pools do
 * not match.
 */
export const isSameTypeTokenPair = (
  tokenA: TokenPoolLookupToken | null | undefined,
  tokenB: TokenPoolLookupToken | null | undefined
): boolean => {
  if (!isTokenPoolLookupToken(tokenA) || !isTokenPoolLookupToken(tokenB)) {
    return false;
  }

  if (tokenA.chain.toLowerCase() !== tokenB.chain.toLowerCase()) {
    return false;
  }

  const tokenAKey = getTokenKey(tokenA);
  const tokenBKey = getTokenKey(tokenB);

  if (
    stableTokenKeySet.has(tokenAKey) &&
    stableTokenKeySet.has(tokenBKey)
  ) {
    return true;
  }

  return (
    nativeAndDerivativeTokenKeySet.has(tokenAKey) &&
    nativeAndDerivativeTokenKeySet.has(tokenBKey)
  );
};
