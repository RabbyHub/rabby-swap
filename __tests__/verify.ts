import { CHAINS, CHAINS_ENUM } from "@debank/common";
import {
  DEX_ENUM,
  DEX_ROUTER_WHITELIST,
  UNI_NATIVE_TO_ADDRESSES,
  WrapTokenAddressMap,
  getRouter,
  getSpender,
  isSwapWrapToken,
  matchDecodedCalldata,
  verifyCalldata,
  verifyRouterAndSpender,
  verifySdk,
  isSwapCalldataReceiverAllowed,
} from "../src";
import { DecodeCalldataResult, QuoteResult } from "../src/quote";

const ETH_NATIVE = CHAINS[CHAINS_ENUM.ETH].nativeTokenAddress;
const WETH = WrapTokenAddressMap[CHAINS_ENUM.ETH];
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const ONEINCH_ETH =
  DEX_ROUTER_WHITELIST[DEX_ENUM.ONEINCH][CHAINS_ENUM.ETH];
const USER = "0x1111111111111111111111111111111111111111";
const ATTACKER = "0x2222222222222222222222222222222222222222";
const ZERO = "0x0000000000000000000000000000000000000000";

const decoded: DecodeCalldataResult = {
  fromToken: USDC,
  fromTokenAmount: "1000000",
  toToken: WETH,
  minReceiveToTokenAmount: "990000000000000000",
  toTokenReceiver: ATTACKER,
};

const quote = (over: Partial<QuoteResult> = {}): QuoteResult => ({
  tx: {
    from: ATTACKER,
    to: ONEINCH_ETH,
    data: "0x",
    value: "0",
  },
  fromToken: USDC,
  fromTokenAmount: "1000000",
  toToken: WETH,
  toTokenAmount: "1000000000000000000",
  spender: ONEINCH_ETH,
  ...over,
});

describe("isSwapWrapToken", () => {
  it("detects native ↔ wrapped", () => {
    expect(
      isSwapWrapToken(ETH_NATIVE, WETH, CHAINS_ENUM.ETH, ETH_NATIVE)
    ).toBe(true);
    expect(
      isSwapWrapToken(WETH, ETH_NATIVE, CHAINS_ENUM.ETH, ETH_NATIVE)
    ).toBe(true);
  });

  it("rejects same token or unrelated pair", () => {
    expect(
      isSwapWrapToken(ETH_NATIVE, ETH_NATIVE, CHAINS_ENUM.ETH, ETH_NATIVE)
    ).toBe(false);
    expect(
      isSwapWrapToken(USDC, WETH, CHAINS_ENUM.ETH, ETH_NATIVE)
    ).toBe(false);
  });
});

describe("getRouter / getSpender", () => {
  it("returns whitelist addresses", () => {
    expect(
      getRouter(DEX_ENUM.ONEINCH, CHAINS_ENUM.ETH, USDC, ETH_NATIVE)
    ).toBe(ONEINCH_ETH);
    expect(getSpender(DEX_ENUM.ONEINCH, CHAINS_ENUM.ETH)).toBe(ONEINCH_ETH);
  });

  it("uses Uni native-in router when paying native", () => {
    expect(
      getRouter(DEX_ENUM.UNI, CHAINS_ENUM.ETH, ETH_NATIVE, ETH_NATIVE)
    ).toBe(UNI_NATIVE_TO_ADDRESSES[CHAINS_ENUM.ETH]);
    expect(
      getRouter(DEX_ENUM.UNI, CHAINS_ENUM.ETH, USDC, ETH_NATIVE)
    ).toBe(DEX_ROUTER_WHITELIST[DEX_ENUM.UNI][CHAINS_ENUM.ETH]);
  });

  it("returns empty spender for wrap", () => {
    expect(getSpender(DEX_ENUM.WRAPTOKEN, CHAINS_ENUM.ETH)).toBe("");
  });
});

describe("verifyRouterAndSpender", () => {
  const base = {
    chain: CHAINS_ENUM.ETH,
    dexId: DEX_ENUM.ONEINCH,
    router: ONEINCH_ETH,
    spender: ONEINCH_ETH,
    payTokenId: USDC,
    receiveTokenId: WETH,
    nativeTokenAddress: ETH_NATIVE,
  };

  it("passes matching whitelist", () => {
    expect(verifyRouterAndSpender(base)).toEqual([true, true]);
  });

  describe.each(["", undefined])("spender = %p", (spender) => {
    it("skips only spender verification for a valid router", () => {
      expect(verifyRouterAndSpender({ ...base, spender })).toEqual([true, true]);
    });

    it.each([USDC, ETH_NATIVE])(
      "rejects a foreign router when paying %s",
      (payTokenId) => {
        expect(
          verifyRouterAndSpender({
            ...base,
            payTokenId,
            receiveTokenId: payTokenId === ETH_NATIVE ? USDC : WETH,
            router: ATTACKER,
            spender,
          })
        ).toEqual([false, true]);
      }
    );
  });

  it("rejects a nonempty foreign spender for ERC20 payment", () => {
    expect(
      verifyRouterAndSpender({ ...base, spender: ATTACKER })
    ).toEqual([true, false]);
  });

  it("fails a foreign router", () => {
    expect(verifyRouterAndSpender({ ...base, router: ATTACKER })).toEqual([
      false,
      true,
    ]);
  });

  it("skips spender for native pay", () => {
    expect(
      verifyRouterAndSpender({
        ...base,
        payTokenId: ETH_NATIVE,
        spender: ATTACKER,
      })
    ).toEqual([true, true]);
  });

  it("passes wrap dex without checking whitelist", () => {
    expect(
      verifyRouterAndSpender({
        ...base,
        dexId: DEX_ENUM.WRAPTOKEN,
        router: ATTACKER,
        spender: ATTACKER,
      })
    ).toEqual([true, true]);
  });
});

describe("isSwapCalldataReceiverAllowed", () => {
  it("allows the current account", () => {
    expect(isSwapCalldataReceiverAllowed(USER, USER)).toBe(true);
    expect(
      isSwapCalldataReceiverAllowed(USER.toUpperCase(), USER.toLowerCase())
    ).toBe(true);
  });

  it("rejects a third-party receiver", () => {
    expect(isSwapCalldataReceiverAllowed(ATTACKER, USER)).toBe(false);
  });

  it("treats the zero address as msg.sender", () => {
    expect(isSwapCalldataReceiverAllowed(ZERO, USER)).toBe(true);
  });

  it("skips when the decoder did not extract a receiver", () => {
    expect(isSwapCalldataReceiverAllowed(undefined, USER)).toBe(true);
    expect(isSwapCalldataReceiverAllowed("", USER)).toBe(true);
  });

  it("fails closed when a receiver is present but userAddress is missing", () => {
    expect(isSwapCalldataReceiverAllowed(ATTACKER, undefined)).toBe(false);
  });
});

describe("matchDecodedCalldata", () => {
  it("passes when decoded matches quote within 5%", () => {
    expect(matchDecodedCalldata(decoded, quote(), 0.01)).toBe(true);
  });

  it("fails a redirected token or amount", () => {
    expect(
      matchDecodedCalldata(
        { ...decoded, toToken: ATTACKER },
        quote(),
        0.01
      )
    ).toBe(false);
    expect(
      matchDecodedCalldata(
        { ...decoded, fromTokenAmount: "1" },
        quote(),
        0.01
      )
    ).toBe(false);
  });

  it("does not look at toTokenReceiver", () => {
    expect(
      matchDecodedCalldata(
        { ...decoded, toTokenReceiver: ATTACKER },
        quote(),
        0.01
      )
    ).toBe(true);
  });
});

describe("verifyCalldata", () => {
  it.each([1, 999999999])(
    "rejects decoded mismatches without looking up chain %s",
    (chainId) => {
      expect(
        verifyCalldata({
          data: quote(),
          dexId: DEX_ENUM.ONEINCH,
          slippage: 0.01,
          tx: { ...quote().tx, chainId },
          decoded: { ...decoded, fromTokenAmount: "1" },
        })
      ).toBe(false);
    }
  );

  it("passes when decoder returns null", () => {
    expect(
      verifyCalldata({
        data: quote(),
        dexId: DEX_ENUM.UNI,
        slippage: 0.01,
        tx: { ...quote().tx, chainId: 1 },
      })
    ).toBe(true);
  });

  it("uses a provided decoded result", () => {
    expect(
      verifyCalldata({
        data: quote(),
        dexId: DEX_ENUM.ONEINCH,
        slippage: 0.01,
        tx: { ...quote().tx, chainId: 1 },
        decoded,
      })
    ).toBe(true);
  });
});

describe("verifySdk", () => {
  it("combines router, spender and calldata", () => {
    const res = verifySdk({
      chain: CHAINS_ENUM.ETH,
      dexId: DEX_ENUM.ONEINCH,
      slippage: 1,
      data: quote(),
      payTokenId: USDC,
      receiveTokenId: WETH,
      nativeTokenAddress: ETH_NATIVE,
      chainId: 1,
      userAddress: USER,
    });
    expect(res.routerPass).toBe(true);
    expect(res.spenderPass).toBe(true);
    expect(res.callDataPass).toBe(true);
    expect(res.receiverPass).toBe(true);
    expect(res.isSdkDataPass).toBe(true);
    expect(res.decoded).toBeNull();
  });

  it.each([
    ["wrap", ETH_NATIVE, WETH],
    ["unwrap", WETH, ETH_NATIVE],
  ])("treats %s as WRAPTOKEN", (_, payTokenId, receiveTokenId) => {
    const res = verifySdk({
      chain: CHAINS_ENUM.ETH,
      dexId: DEX_ENUM.ONEINCH,
      slippage: 1,
      data: quote({
        tx: { ...quote().tx, to: ATTACKER },
        spender: ATTACKER,
        fromToken: payTokenId,
        toToken: receiveTokenId,
      }),
      payTokenId,
      receiveTokenId,
      nativeTokenAddress: ETH_NATIVE,
      chainId: 1,
      userAddress: USER,
    });
    expect(res.isSdkDataPass).toBe(true);
    expect(res.decoded).toBeNull();
  });

  it("rejects a foreign router even when spender is empty", () => {
    const res = verifySdk({
      chain: CHAINS_ENUM.ETH,
      dexId: DEX_ENUM.ONEINCH,
      slippage: 1,
      data: quote({ tx: { ...quote().tx, to: ATTACKER }, spender: "" }),
      payTokenId: USDC,
      receiveTokenId: WETH,
      nativeTokenAddress: ETH_NATIVE,
      chainId: 1,
      userAddress: USER,
    });
    expect(res.routerPass).toBe(false);
    expect(res.spenderPass).toBe(true);
    expect(res.isSdkDataPass).toBe(false);
  });

  it("fails a foreign router", () => {
    const res = verifySdk({
      chain: CHAINS_ENUM.ETH,
      dexId: DEX_ENUM.ONEINCH,
      slippage: 1,
      data: quote({ tx: { ...quote().tx, to: ATTACKER } }),
      payTokenId: USDC,
      receiveTokenId: WETH,
      nativeTokenAddress: ETH_NATIVE,
      chainId: 1,
      userAddress: USER,
    });
    expect(res.routerPass).toBe(false);
    expect(res.isSdkDataPass).toBe(false);
  });
});
