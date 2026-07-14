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

    it("does not match two derivatives", () => {
      expect(isSameTypeTokenPair(STETH, CBETH)).toBe(false);
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
  });

  it("returns false for incomplete runtime values", () => {
    expect(isSameTypeTokenPair(null, undefined)).toBe(false);
    expect(isSameTypeTokenPair({} as any, ETH)).toBe(false);
  });
});
