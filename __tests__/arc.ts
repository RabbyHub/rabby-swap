import { CHAINS_ENUM } from "@debank/common";
import {
  ARC_ERC20_USDC,
  DEX_ENUM,
  DEX_ROUTER_WHITELIST,
  DEX_SPENDER_WHITELIST,
  DEX_SUPPORT_CHAINS,
  UNI_NATIVE_TO_ADDRESSES,
  verifyRouterAndSpender,
} from "../src";
import { resolveSwapTxValue } from "../src/utils";

const ARC = "ARC";
const routerWhitelist = DEX_ROUTER_WHITELIST as Record<
  string,
  Record<string, string>
>;
const spenderWhitelist = DEX_SPENDER_WHITELIST as Record<
  string,
  Record<string, string>
>;
const uniNativeToAddresses = UNI_NATIVE_TO_ADDRESSES as Record<string, string>;

const ARC_NATIVE = "arc";
const UNI_ROUTER = "0x4fcA4a51Ab4F23A7447b3284fBd7D73289A89Fb1";
const UNI_SPENDER = "0x02E5be68D46DAc0B524905bfF209cf47EE6dB2a9";
const CRCL = "0x2ba0f44bdfc17fba30eda9cdbecb908ca45b043b";
const ARCHITECTS = "0x8bcb94279fc2c984ec34e0c1f2192df8c69ea4f0";

describe("Arc DEX configuration", () => {
  it.each([
    [DEX_ENUM.ONEINCH, "0xE08CAb0828a67291EC4Af1FB3e7f867e206A6bdA"],
    [DEX_ENUM.KYBERSWAP, "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5"],
    [DEX_ENUM.ZEROXAPIV2, "0x0000000000001fF3684f28c67538d4D072C22734"],
  ])("supports %s with the same Arc router and spender", (dex, address) => {
    expect(DEX_SUPPORT_CHAINS[dex]).toContain(ARC);
    expect(routerWhitelist[dex][ARC].toLowerCase()).toBe(address.toLowerCase());
    expect(spenderWhitelist[dex][ARC].toLowerCase()).toBe(
      address.toLowerCase()
    );
  });

  it("uses the Uni proxy by default and Universal Router for native inputs", () => {
    expect(DEX_SUPPORT_CHAINS[DEX_ENUM.UNI]).toContain(ARC);
    expect(routerWhitelist[DEX_ENUM.UNI][ARC].toLowerCase()).toBe(
      UNI_SPENDER.toLowerCase()
    );
    expect(spenderWhitelist[DEX_ENUM.UNI][ARC].toLowerCase()).toBe(
      UNI_SPENDER.toLowerCase()
    );
    expect(uniNativeToAddresses[ARC].toLowerCase()).toBe(
      UNI_ROUTER.toLowerCase()
    );
  });
});

describe("Arc Uni router validation", () => {
  it.each([
    ["native USDC", ARC_NATIVE, UNI_ROUTER, UNI_SPENDER],
    ["ERC20 USDC", ARC_ERC20_USDC, UNI_ROUTER, UNI_SPENDER],
    ["CRCL", CRCL, UNI_SPENDER, UNI_ROUTER],
  ])("accepts only the correct entry point for %s", (_, payTokenId, router, wrongRouter) => {
    const params = {
      chain: ARC as CHAINS_ENUM,
      dexId: DEX_ENUM.UNI,
      payTokenId,
      receiveTokenId: ARCHITECTS,
      nativeTokenAddress: ARC_NATIVE,
      spender: UNI_SPENDER,
    };

    expect(verifyRouterAndSpender({ ...params, router })).toEqual([true, true]);
    expect(
      verifyRouterAndSpender({ ...params, router: wrongRouter })
    ).toEqual([false, true]);
  });

  it("rejects Universal Router as the spender for CRCL", () => {
    expect(
      verifyRouterAndSpender({
        chain: ARC as CHAINS_ENUM,
        dexId: DEX_ENUM.UNI,
        payTokenId: CRCL,
        receiveTokenId: ARCHITECTS,
        nativeTokenAddress: ARC_NATIVE,
        router: UNI_SPENDER,
        spender: UNI_ROUTER,
      })
    ).toEqual([true, false]);
  });
});

describe("Arc Uni 0x3600 USDC native value", () => {
  it.each([ARC_NATIVE, ARC_ERC20_USDC])("scales USDC value when the API pay token is %s", (payTokenId) => {
    expect(
      resolveSwapTxValue({
        dex: DEX_ENUM.UNI,
        chain: ARC as CHAINS_ENUM,
        fromToken: ARC_ERC20_USDC,
        payTokenId,
        nativeTokenAddress: ARC_NATIVE,
        amount: "1000000",
      })
    ).toBe("1000000000000000000");
  });

  it("does not attach native value when Uni pays CRCL", () => {
    expect(
      resolveSwapTxValue({
        dex: DEX_ENUM.UNI,
        chain: ARC as CHAINS_ENUM,
        fromToken: CRCL,
        payTokenId: CRCL,
        nativeTokenAddress: ARC_NATIVE,
        amount: "1400000000000000",
      })
    ).toBe("0");
  });

  it("keeps native-in quotes unscaled", () => {
    expect(
      resolveSwapTxValue({
        dex: DEX_ENUM.UNI,
        chain: ARC as CHAINS_ENUM,
        fromToken: ARC_NATIVE,
        payTokenId: ARC_NATIVE,
        nativeTokenAddress: ARC_NATIVE,
        amount: "1000000000000000000",
      })
    ).toBe("1000000000000000000");
  });

  it("does not attach native value for other Arc aggregators paying 0x3600 USDC", () => {
    expect(
      resolveSwapTxValue({
        dex: DEX_ENUM.KYBERSWAP,
        chain: ARC as CHAINS_ENUM,
        fromToken: ARC_ERC20_USDC,
        payTokenId: ARC_ERC20_USDC,
        nativeTokenAddress: ARC_NATIVE,
        amount: "1000000",
      })
    ).toBe("0");
  });
});
