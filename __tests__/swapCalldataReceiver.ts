import { Interface } from "@ethersproject/abi";
import { CHAINS, CHAINS_ENUM } from "@debank/common";
import { DEX_ENUM } from "../src/consts";
import { KyberswapABI, OpenOceanABI } from "../src/abi";
import { decodeCalldata } from "../src/quote";
import { NULL_ADDRESS, isSameAddress } from "../src/utils";
import {
  DEX_ROUTER_WHITELIST,
  DEX_SPENDER_WHITELIST,
  isSwapCalldataReceiverAllowed,
  verifySdk,
} from "../src";

const USER = "0x1111111111111111111111111111111111111111";
const ATTACKER = "0x2222222222222222222222222222222222222222";
const TOKEN_IN = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const TOKEN_OUT = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ETH_NATIVE = CHAINS[CHAINS_ENUM.ETH].nativeTokenAddress;

const kyberInterface = new Interface(KyberswapABI);
const openOceanInterface = new Interface(OpenOceanABI);

const encodeKyberSwap = (
  dstReceiver: string,
  from = USER,
  srcToken = TOKEN_IN,
  dstToken = TOKEN_OUT
) => {
  const data = kyberInterface.encodeFunctionData("swap", [
    {
      callTarget: USER,
      approveTarget: USER,
      targetData: "0x",
      desc: {
        srcToken,
        dstToken,
        srcReceivers: [],
        srcAmounts: [],
        feeReceivers: [],
        feeAmounts: [],
        dstReceiver,
        amount: "1000",
        minReturnAmount: "900",
        flags: 0,
        permit: "0x",
      },
      clientData: "0x",
    },
  ]);

  return {
    from,
    to: USER,
    data,
    value: srcToken === NATIVE ? "0x3e8" : "0x0",
    chainId: 1,
  };
};

const encodeKyberSwapSimpleMode = (
  dstReceiver: string,
  from = USER,
  srcToken = TOKEN_IN,
  dstToken = TOKEN_OUT
) => {
  const data = kyberInterface.encodeFunctionData("swapSimpleMode", [
    USER,
    {
      srcToken,
      dstToken,
      srcReceivers: [],
      srcAmounts: [],
      feeReceivers: [],
      feeAmounts: [],
      dstReceiver,
      amount: "1000",
      minReturnAmount: "900",
      flags: 0,
      permit: "0x",
    },
    "0x",
    "0x",
  ]);

  return {
    from,
    to: USER,
    data,
    value: srcToken === NATIVE ? "0x3e8" : "0x0",
    chainId: 1,
  };
};

const encodeOpenOceanSwap = (
  dstReceiver: string,
  from = USER,
  srcToken = TOKEN_IN,
  dstToken = TOKEN_OUT
) => {
  const data = openOceanInterface.encodeFunctionData("swap", [
    USER,
    {
      srcToken,
      dstToken,
      srcReceiver: USER,
      dstReceiver,
      amount: "1000",
      minReturnAmount: "900",
      guaranteedAmount: "1000",
      flags: 0,
      referrer: NULL_ADDRESS,
      permit: "0x",
    },
    [],
  ]);

  return {
    from,
    to: USER,
    data,
    value: srcToken === NATIVE ? "0x3e8" : "0x0",
    chainId: 1,
  };
};

// ABI fixtures verify decoder behavior; they do not assert on-chain route availability.
describe.each([
  { name: "KyberSwap swap", dexId: DEX_ENUM.KYBERSWAP as const, encode: encodeKyberSwap },
  { name: "KyberSwap swapSimpleMode", dexId: DEX_ENUM.KYBERSWAP as const, encode: encodeKyberSwapSimpleMode },
  { name: "OpenOcean swap", dexId: DEX_ENUM.OPENOCEAN as const, encode: encodeOpenOceanSwap },
])("$name token pairs", ({ dexId, encode }) => {
  describe.each([
    { name: "ETH → USDC", src: NATIVE, dst: TOKEN_IN, fromToken: ETH_NATIVE, toToken: TOKEN_IN },
    { name: "USDC → ETH", src: TOKEN_IN, dst: NATIVE, fromToken: TOKEN_IN, toToken: ETH_NATIVE },
    { name: "WETH → USDC", src: TOKEN_OUT, dst: TOKEN_IN, fromToken: TOKEN_OUT, toToken: TOKEN_IN },
    { name: "USDC → WETH", src: TOKEN_IN, dst: TOKEN_OUT, fromToken: TOKEN_IN, toToken: TOKEN_OUT },
    { name: "USDC → USDT", src: TOKEN_IN, dst: USDT, fromToken: TOKEN_IN, toToken: USDT },
  ])("$name", ({ src, dst, fromToken, toToken }) => {
    const makeParams = (receiver = USER) => ({
      chain: CHAINS_ENUM.ETH,
      dexId,
      slippage: 10,
      data: {
        tx: {
          ...encode(receiver, USER, src, dst),
          to: DEX_ROUTER_WHITELIST[dexId][CHAINS_ENUM.ETH],
        },
        fromToken,
        toToken,
        fromTokenAmount: "1000",
        toTokenAmount: "1000",
        spender: DEX_SPENDER_WHITELIST[dexId][CHAINS_ENUM.ETH],
      },
      payTokenId: fromToken,
      receiveTokenId: toToken,
      nativeTokenAddress: ETH_NATIVE,
      chainId: 1,
      userAddress: USER,
    });

    it.each([
      { name: "current user", receiver: USER, expectedReceiver: USER, allowed: true },
      { name: "third party", receiver: ATTACKER, expectedReceiver: ATTACKER, allowed: false },
      { name: "zero address", receiver: NULL_ADDRESS, expectedReceiver: USER, allowed: true },
    ])("decodes and verifies $name receiver", ({ receiver, expectedReceiver, allowed }) => {
      const params = makeParams(receiver);
      const expected = {
        fromToken,
        toToken,
        fromTokenAmount: "1000",
        minReceiveToTokenAmount: "900",
        toTokenReceiver: expectedReceiver,
      };

      const decoded = decodeCalldata(dexId, params.data.tx);
      expect(decoded).not.toBeNull();
      expect(decoded).toEqual(expected);
      expect(isSwapCalldataReceiverAllowed(decoded!.toTokenReceiver, USER)).toBe(allowed);

      const result = verifySdk(params);
      expect(result.decoded).not.toBeNull();
      expect(result.decoded).toEqual(expected);
      expect(result.routerPass).toBe(true);
      expect(result.spenderPass).toBe(true);
      expect(result.callDataPass).toBe(true);
      expect(result.receiverPass).toBe(allowed);
      expect(result.isSdkDataPass).toBe(allowed);
    });

    it.each([
      { name: "input token", mismatch: { fromToken: USDT } },
      { name: "output token", mismatch: { toToken: ATTACKER } },
      { name: "input amount", mismatch: { fromTokenAmount: "2000" } },
      { name: "minimum received amount", mismatch: { toTokenAmount: "2000" } },
    ])("rejects a mismatched $name after successful decoding", ({ mismatch }) => {
      const params = makeParams();
      const result = verifySdk({
        ...params,
        data: { ...params.data, ...mismatch },
      });

      expect(result.decoded).not.toBeNull();
      expect(result.decoded).toEqual({
        fromToken,
        toToken,
        fromTokenAmount: "1000",
        minReceiveToTokenAmount: "900",
        toTokenReceiver: USER,
      });
      expect(result.routerPass).toBe(true);
      expect(result.spenderPass).toBe(true);
      expect(result.receiverPass).toBe(true);
      expect(result.callDataPass).toBe(false);
      expect(result.isSdkDataPass).toBe(false);
    });
  });
});

describe("KyberSwap calldata receiver", () => {
  it("returns the encoded dstReceiver instead of tx.from", () => {
    const res = decodeCalldata(DEX_ENUM.KYBERSWAP, encodeKyberSwap(ATTACKER));

    expect(isSameAddress(res!.toTokenReceiver, ATTACKER)).toBe(true);
    expect(isSameAddress(res!.toTokenReceiver, USER)).toBe(false);
    expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
      false
    );
  });

  it("returns the current account when it is the encoded dstReceiver", () => {
    const res = decodeCalldata(DEX_ENUM.KYBERSWAP, encodeKyberSwap(USER));

    expect(isSameAddress(res!.toTokenReceiver, USER)).toBe(true);
    expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
      true
    );
  });

  it("normalizes address(0) dstReceiver to tx.from", () => {
    const res = decodeCalldata(
      DEX_ENUM.KYBERSWAP,
      encodeKyberSwap(NULL_ADDRESS)
    );

    expect(isSameAddress(res!.toTokenReceiver, USER)).toBe(true);
    expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
      true
    );
  });

  it("returns the encoded dstReceiver for swapSimpleMode", () => {
    const res = decodeCalldata(
      DEX_ENUM.KYBERSWAP,
      encodeKyberSwapSimpleMode(ATTACKER)
    );

    expect(isSameAddress(res!.toTokenReceiver, ATTACKER)).toBe(true);
    expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
      false
    );
  });
});

describe("OpenOcean calldata receiver", () => {
  it("returns the encoded dstReceiver instead of tx.from", () => {
    const res = decodeCalldata(
      DEX_ENUM.OPENOCEAN,
      encodeOpenOceanSwap(ATTACKER)
    );

    expect(isSameAddress(res!.toTokenReceiver, ATTACKER)).toBe(true);
    expect(isSameAddress(res!.toTokenReceiver, USER)).toBe(false);
    expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
      false
    );
  });

  it("returns the current account when it is the encoded dstReceiver", () => {
    const res = decodeCalldata(DEX_ENUM.OPENOCEAN, encodeOpenOceanSwap(USER));

    expect(isSameAddress(res!.toTokenReceiver, USER)).toBe(true);
    expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
      true
    );
  });

  it("normalizes address(0) dstReceiver to tx.from", () => {
    const res = decodeCalldata(
      DEX_ENUM.OPENOCEAN,
      encodeOpenOceanSwap(NULL_ADDRESS)
    );

    expect(isSameAddress(res!.toTokenReceiver, USER)).toBe(true);
    expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
      true
    );
  });
});
