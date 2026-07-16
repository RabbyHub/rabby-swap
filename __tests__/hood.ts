import {
  DEX_ENUM,
  DEX_ROUTER_WHITELIST,
  DEX_SPENDER_WHITELIST,
  DEX_SUPPORT_CHAINS,
  UNI_NATIVE_TO_ADDRESSES,
} from "../src";

const HOOD = "HOOD";
const routerWhitelist = DEX_ROUTER_WHITELIST as Record<
  string,
  Record<string, string>
>;
const spenderWhitelist = DEX_SPENDER_WHITELIST as Record<
  string,
  Record<string, string>
>;
const uniNativeToAddresses = UNI_NATIVE_TO_ADDRESSES as Record<string, string>;

describe("Hood DEX configuration", () => {
  it.each([
    [
      DEX_ENUM.KYBERSWAP,
      "0x6131b5fae19ea4f9d964eac0408e4408b66337b5",
    ],
    [DEX_ENUM.UNI, "0x02E5be68D46DAc0B524905bfF209cf47EE6dB2a9"],
    [
      DEX_ENUM.OPENOCEAN,
      "0x6352a56caadc4f1e25cd6c75970fa768a3304e64",
    ],
  ])("supports %s with its Hood router and spender", (dex, address) => {
    expect(DEX_SUPPORT_CHAINS[dex]).toContain(HOOD);
    expect(routerWhitelist[dex][HOOD]).toBe(address);
    expect(spenderWhitelist[dex][HOOD]).toBe(address);
  });

  it("uses the Hood Universal Router when Uni pays with native ETH", () => {
    expect(uniNativeToAddresses[HOOD]).toBe(
      "0x8876789976decbfcbbbe364623c63652db8c0904"
    );
  });
});
