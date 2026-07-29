import {
  NATIVE_AND_DERIVATIVE_TOKEN_POOL,
  STABLE_TOKEN_POOL,
  isSameTypeTokenPair,
} from "../src";

const ETH = { chain: "eth", id: "eth" };
const WETH = {
  chain: "eth",
  id: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
};
const STETH = {
  chain: "eth",
  id: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
};
const WSTETH = {
  chain: "eth",
  id: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
};
const CBETH = {
  chain: "eth",
  id: "0xBe9895146f7AF43049ca1c1AE358B0541Ea49704",
};

describe("token pools", () => {
  describe("isSameTypeTokenPair", () => {
    it("matches two stablecoins on the same chain", () => {
      expect(
        isSameTypeTokenPair(
          {
            chain: "eth",
            id: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          },
          {
            chain: "ETH",
            id: "0xDAC17F958D2EE523A2206206994597C13D831EC7",
          }
        )
      ).toBe(true);
    });

    it("rejects stablecoins on different chains", () => {
      expect(
        isSameTypeTokenPair(
          {
            chain: "eth",
            id: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          },
          {
            chain: "base",
            id: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          }
        )
      ).toBe(false);
    });

    it("rejects tokens from different pools", () => {
      expect(
        isSameTypeTokenPair(
          {
            chain: "eth",
            id: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          },
          STETH
        )
      ).toBe(false);
    });

    it("includes EURC and Robinhood USDG", () => {
      expect(
        STABLE_TOKEN_POOL.some(
          (token) =>
            token.chain === "base" &&
            token.id.toLowerCase() ===
              "0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42"
        )
      ).toBe(true);
      expect(
        STABLE_TOKEN_POOL.some(
          (token) =>
            token.chain === "hood" &&
            token.id.toLowerCase() ===
              "0x5fc5360d0400a0fd4f2af552add042d716f1d168"
        )
      ).toBe(true);
    });

    it("includes the supplied stablecoin contracts", () => {
      const suppliedStablecoins = [
        ["arb", "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"],
        ["bsc", "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d"],
        ["hyper", "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb"],
        ["matic", "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"],
        ["uni", "0x9151434b16b9763660705744891fA906F660EcC5"],
        ["eth", "0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E"],
      ];

      for (const [chain, id] of suppliedStablecoins) {
        expect(
          STABLE_TOKEN_POOL.some(
            (token) =>
              token.chain === chain &&
              token.id.toLowerCase() === id.toLowerCase()
          )
        ).toBe(true);
      }
    });

    it("includes official USDC and USDT on supported chains", () => {
      const officialStablecoins = [
        // Circle-issued USDC
        ["arb", "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"],
        ["avax", "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"],
        ["base", "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"],
        ["celo", "0xcebA9300f2b948710d2653dD7B07f33A8B32118C"],
        ["cro", "0x3D7F2C478aAfdB65542BCB44bCeeC05849999d2D"],
        ["era", "0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4"],
        ["eth", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
        ["hyper", "0xb88339CB7199b77E23DB6E890353E22632Ba630f"],
        ["ink", "0x2D270e6886d130D724215A266106e6832161EAEd"],
        ["linea", "0x176211869cA2b568f2A7D4EE941E073a821EE1ff"],
        ["matic", "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"],
        ["monad", "0x754704Bc059F8C67012fEd69BC8A327a5aafb603"],
        ["op", "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"],
        ["sei", "0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392"],
        ["sonic", "0x29219dd400f2Bf60E5a23d13Be72B486D4038894"],
        ["uni", "0x078D782b760474a361dDA0AF3839290b0EF57AD6"],
        // Tether-issued USD₮
        ["avax", "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7"],
        ["celo", "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e"],
        ["eth", "0xdAC17F958D2ee523a2206206994597C13D831ec7"],
        ["kava", "0x919C1c267BC06a7039e03fcc2eF738525769109c"],
        ["klay", "0xd077A400968890Eacc75cdc901F0356c943e4fDb"],
      ];

      for (const [chain, id] of officialStablecoins) {
        expect(
          STABLE_TOKEN_POOL.some(
            (token) =>
              token.chain === chain &&
              token.id.toLowerCase() === id.toLowerCase()
          )
        ).toBe(true);
      }
    });

    it("includes official USD1 and USDe on supported chains", () => {
      const officialStablecoins = [
        // USD1
        ["bsc", "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d"],
        ["eth", "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d"],
        ["mnt", "0x111111d2bf19e43c34263401e0cad979ed1cdb61"],
        ["monad", "0x111111d2bf19e43c34263401e0cad979ed1cdb61"],
        ["xlayer", "0x111111d2bf19e43c34263401e0cad979ed1cdb61"],
        // USDe
        ["arb", "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34"],
        ["base", "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34"],
        ["bera", "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34"],
        ["blast", "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34"],
        ["bsc", "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34"],
        ["era", "0x39Fe7a0DACcE31Bd90418e3e659fb0b5f0B3Db0d"],
        ["eth", "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3"],
        ["kava", "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34"],
        ["linea", "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34"],
        ["manta", "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34"],
        ["metis", "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34"],
        ["mnt", "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34"],
        ["mode", "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34"],
        ["op", "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34"],
        ["scrl", "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34"],
        ["xlayer", "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34"],
      ];

      for (const [chain, id] of officialStablecoins) {
        expect(
          STABLE_TOKEN_POOL.some(
            (token) =>
              token.chain === chain &&
              token.id.toLowerCase() === id.toLowerCase()
          )
        ).toBe(true);
      }
    });

    it("includes the newly curated stablecoin families", () => {
      const curatedStablecoins = [
        // Explicitly requested additions
        ["bsc", "0xe9e7cea3dedca5984780bafc599bd69add087d56"], // BUSD
        ["monad", "0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a"], // AUSD
        // Widely used or medium-sized USD stablecoins
        ["eth", "0x8292bb45bf1ee4d140127049757c2e0ff06317ed"], // RLUSD
        ["eth", "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f"], // GHO
        ["eth", "0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29"], // frxUSD
        ["eth", "0x73A15FeD60Bf67631dC6cd7Bc5B6e8da8190aCF5"], // USD0
        ["eth", "0xe343167631d89B6Ffc58B88d6b7fB0228795491D"], // USDG
        ["eth", "0xFa2B947eEc368f42195f24F36d2aF29f7c24CeC2"], // USDf
        ["eth", "0x8E870D67F660D95d5be530380D0eC0bd388289E1"], // USDP
        ["eth", "0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd"], // GUSD
        // Non-USD fiat and regulated stablecoins
        ["eth", "0x70e8de73ce538da2beed35d14187f6959a8eca96"], // XSGD
        ["eth", "0x39b8B6385416f4cA36a20319F70D28621895279D"], // EURe
        ["eth", "0x5F7827FDeb7c20b443265Fc2F40845B715385Ff2"], // EURCV
        ["eth", "0x8dF723295214Ea6f21026eeEb4382d475f146F9f"], // EURQ
        ["celo", "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73"], // cEUR
        ["celo", "0xe8537a3d056da446677b9e9d6c5db704eaab4787"], // cREAL
      ];

      for (const [chain, id] of curatedStablecoins) {
        expect(
          STABLE_TOKEN_POOL.some(
            (token) =>
              token.chain === chain &&
              token.id.toLowerCase() === id.toLowerCase()
          )
        ).toBe(true);
      }
    });

    it("matches newly added stablecoins only on the same chain", () => {
      const bscBusd = {
        chain: "bsc",
        id: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
      };
      const bscAusd = {
        chain: "bsc",
        id: "0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a",
      };
      const monadAusd = {
        chain: "monad",
        id: "0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a",
      };

      expect(isSameTypeTokenPair(bscBusd, bscAusd)).toBe(true);
      expect(isSameTypeTokenPair(monadAusd, bscAusd)).toBe(false);
    });

    it("matches ETH and WETH in either direction", () => {
      expect(isSameTypeTokenPair(ETH, WETH)).toBe(true);
      expect(isSameTypeTokenPair(WETH, ETH)).toBe(true);
    });

    it("matches ETH or WETH with a derivative", () => {
      expect(isSameTypeTokenPair(ETH, STETH)).toBe(true);
      expect(isSameTypeTokenPair(STETH, ETH)).toBe(true);
      expect(isSameTypeTokenPair(WETH, STETH)).toBe(true);
      expect(isSameTypeTokenPair(STETH, WETH)).toBe(true);
    });

    it("matches any two derivatives in the pool", () => {
      expect(isSameTypeTokenPair(STETH, CBETH)).toBe(true);
      expect(isSameTypeTokenPair(STETH, WSTETH)).toBe(true);
      expect(isSameTypeTokenPair(WSTETH, STETH)).toBe(true);
    });

    it("matches the same token when it is in a pool", () => {
      expect(isSameTypeTokenPair(STETH, STETH)).toBe(true);
    });

    it("normalizes address casing but not chain identity", () => {
      expect(
        isSameTypeTokenPair(ETH, {
          chain: "ETH",
          id: STETH.id.toUpperCase(),
        })
      ).toBe(true);
      expect(
        isSameTypeTokenPair(ETH, {
          chain: "arb",
          id: STETH.id,
        })
      ).toBe(false);
    });

    it("exports ETH, WETH and configured derivatives", () => {
      expect(NATIVE_AND_DERIVATIVE_TOKEN_POOL).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ chain: "eth", id: "eth" }),
          expect.objectContaining({
            chain: "eth",
            id: WETH.id,
          }),
          expect.objectContaining({
            chain: "eth",
            id: STETH.id,
          }),
        ])
      );
    });

    it("keeps pool items minimal", () => {
      for (const token of [
        ...STABLE_TOKEN_POOL,
        ...NATIVE_AND_DERIVATIVE_TOKEN_POOL,
      ]) {
        expect(Object.keys(token).sort()).toEqual(["chain", "id"]);
      }
    });

    it("keeps chain and token address entries unique in each pool", () => {
      for (const pool of [
        STABLE_TOKEN_POOL,
        NATIVE_AND_DERIVATIVE_TOKEN_POOL,
      ]) {
        const keys = pool.map(
          (token) => `${token.chain.toLowerCase()}:${token.id.toLowerCase()}`
        );

        expect(new Set(keys).size).toBe(keys.length);
      }
    });
  });

  it("returns false for incomplete runtime values", () => {
    expect(isSameTypeTokenPair(null, undefined)).toBe(false);
    expect(isSameTypeTokenPair({} as any, ETH)).toBe(false);
  });
});
