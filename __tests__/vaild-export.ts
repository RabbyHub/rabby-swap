import {
  DEX_SUPPORT_CHAINS,
  DEX_ROUTER_WHITELIST,
  DEX_SPENDER_WHITELIST,
  DEX_ENUM,
  WrapTokenAddressMap,
  getQuote,
} from "../src/index";
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
    expect(supportedDEX).toEqual(expectResult);
  });

  // it("WrapTokenAddressMap should supported all chains", () => {
  //   const allChains = Array.from(
  //     new Set(
  //       Object.keys(DEX_ROUTER_WHITELIST)
  //         .map(
  //           (e) =>
  //             DEX_SUPPORT_CHAINS[
  //               e as unknown as keyof typeof DEX_SUPPORT_CHAINS
  //             ]
  //         )
  //         .flat()
  //     )
  //   );
  //   for (const chain of allChains) {
  //     expect(
  //       WrapTokenAddressMap[chain as keyof typeof WrapTokenAddressMap]
  //     ).toBeTruthy();
  //   }
  // });

  it("Export getQuote correctly", async () => {
    const supportedDEX = Object.keys(DEX_SUPPORT_CHAINS);
    for (const dex of supportedDEX) {
      expect(
        getQuote(dex as any, {} as any, {} as any)
      ).rejects.not.toThrowError(`${dex} is not supported!`);
    }
  });

  it("Export decodeCalldata correctly", async () => {
    const supportedDEX = Object.keys(DEX_ROUTER_WHITELIST);
    for (const dex of supportedDEX) {
      expect(decodeCalldata(dex as any, {} as any)).toBeNull();
    }
  });
});
