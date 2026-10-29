import {
  DEX_SUPPORT_CHAINS,
  DEX_ROUTER_WHITELIST,
  DEX_SPENDER_WHITELIST,
  DEX_ENUM,
  WrapTokenAddressMap,
  getQuote,
  verifySdk,
} from "../src/index";
import { CHAINS_ENUM } from "@debank/common";
import { decodeCalldata } from "../src/quote";

describe("correctly export dex", () => {
  it("Export DEX_SUPPORT_CHAINS、DEX_SUPPORT_CHAINS correctly", () => {
    expect(Object.keys(DEX_ROUTER_WHITELIST)).toEqual(
      Object.keys(DEX_SPENDER_WHITELIST)
    );
  });
  it("Export DEX_SUPPORT_CHAINS correctly", () => {
    const supportedDEX = Object.keys(DEX_SUPPORT_CHAINS);
    const expectResult = [
      DEX_ENUM.WRAPTOKEN,
      ...Object.keys(DEX_ROUTER_WHITELIST),
    ];
    // Kept so old clients can still read the key. No chains and no router.
    expectResult.splice(
      expectResult.indexOf(DEX_ENUM.PARASWAPV6) + 1,
      0,
      DEX_ENUM.ODOS
    );
    expect(supportedDEX).toEqual(expectResult);
  });

  it("supports every swap chain that has a wrappable native token", () => {
    const allSwapChains = Array.from(
      new Set(
        Object.entries(DEX_SUPPORT_CHAINS)
          .filter(([dex]) => dex !== DEX_ENUM.WRAPTOKEN)
          .flatMap(([, chains]) => chains)
      )
    );

    const chainsWithoutNativeWrapping = [
      // CELO is already exposed as an ERC-20 at its native-token address.
      CHAINS_ENUM.CELO,
      // USDT0 is both native and ERC-20 on Stable, so no wrapping is needed.
      "STABLE" as CHAINS_ENUM,
      // Tempo has no native token.
      "TEMPO" as CHAINS_ENUM,
      // Arc USDC shares its native balance with an ERC-20 interface; no wrapping is needed.
      "ARC" as CHAINS_ENUM,
    ];
    const unsupportedChains = allSwapChains.filter(
      (chain) => !WrapTokenAddressMap[chain as keyof typeof WrapTokenAddressMap]
    );

    expect(unsupportedChains.sort()).toEqual(
      chainsWithoutNativeWrapping.sort()
    );
  });

  it("derives WrapToken support chains from the address map", () => {
    expect([...DEX_SUPPORT_CHAINS[DEX_ENUM.WRAPTOKEN]].sort()).toEqual(
      Object.keys(WrapTokenAddressMap).sort()
    );
  });

  it("Export getQuote correctly", async () => {
    // ODOS stays in DEX_SUPPORT_CHAINS so old clients can read the key, but it
    // has no chains and is no longer dispatched.
    const quotableDEX = Object.keys(DEX_SUPPORT_CHAINS).filter(
      (dex) => dex !== DEX_ENUM.ODOS
    );
    for (const dex of quotableDEX) {
      await expect(
        getQuote(dex as any, {} as any, {} as any)
      ).rejects.not.toThrowError(`${dex} is not supported!`);
    }
    await expect(
      getQuote(DEX_ENUM.ODOS, {} as any, {} as any)
    ).rejects.toThrow("ODOS is not supported!");
  });

  it("Export verifySdk correctly", () => {
    expect(typeof verifySdk).toBe("function");
  });

  it("Export decodeCalldata correctly", async () => {
    const supportedDEX = Object.keys(DEX_ROUTER_WHITELIST);
    for (const dex of supportedDEX) {
      if (dex === DEX_ENUM.UNI || dex === DEX_ENUM.MAGPIE) {
        expect(() => decodeCalldata(dex, {} as any)).toThrow();
      } else {
        expect(decodeCalldata(dex as any, {} as any)).toBeNull();
      }
    }
  });
});
