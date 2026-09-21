import { CHAINS_ENUM } from "@debank/common";
import {
  ARC_ERC20_USDC,
  DEX_ENUM,
  DEX_ROUTER_WHITELIST,
  DEX_SPENDER_WHITELIST,
  DEX_SUPPORT_CHAINS,
  UNI_NATIVE_TO_ADDRESSES,
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

describe("Arc DEX configuration", () => {
  it.each([
    [DEX_ENUM.ONEINCH, "0xE08CAb0828a67291EC4Af1FB3e7f867e206A6bdA"],
    [DEX_ENUM.KYBERSWAP, "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5"],
    [DEX_ENUM.MAGPIE, "0x20F6ee51340aDEed01A59B0e65cB3703f3DC860c"],
    [DEX_ENUM.ZEROXAPIV2, "0x0000000000001fF3684f28c67538d4D072C22734"],
  ])("supports %s with the same Arc router and spender", (dex, address) => {
    expect(DEX_SUPPORT_CHAINS[dex]).toContain(ARC);
    expect(routerWhitelist[dex][ARC].toLowerCase()).toBe(address.toLowerCase());
    expect(spenderWhitelist[dex][ARC].toLowerCase()).toBe(
      address.toLowerCase()
    );
  });

  it("uses Universal Router as tx.to and the No-Permit2 proxy as spender for Uni", () => {
    expect(DEX_SUPPORT_CHAINS[DEX_ENUM.UNI]).toContain(ARC);
    expect(routerWhitelist[DEX_ENUM.UNI][ARC].toLowerCase()).toBe(
      UNI_ROUTER.toLowerCase()
    );
    expect(spenderWhitelist[DEX_ENUM.UNI][ARC].toLowerCase()).toBe(
      UNI_SPENDER.toLowerCase()
    );
    expect(uniNativeToAddresses[ARC].toLowerCase()).toBe(
      UNI_ROUTER.toLowerCase()
    );
  });
});

describe("Arc Uni 0x3600 USDC native value", () => {
  it("scales 6-decimal USDC raw amount to 18-decimal native value", () => {
    expect(
      resolveSwapTxValue({
        dex: DEX_ENUM.UNI,
        chain: ARC as CHAINS_ENUM,
        fromToken: ARC_ERC20_USDC,
        payTokenId: ARC_NATIVE,
        nativeTokenAddress: ARC_NATIVE,
        amount: "1000000",
      })
    ).toBe("1000000000000000000");
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
