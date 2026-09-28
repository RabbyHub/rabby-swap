import { CHAINS, CHAINS_ENUM } from "@debank/common";
import { defaultAbiCoder, Interface } from "@ethersproject/abi";
import BigNumber from "bignumber.js";
import { DEX_ENUM } from "../src/consts";
import { KyberswapABI, MagpieABI, OpenOceanABI, UniABI } from "../src/abi";
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
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const MSG_SENDER = "0x0000000000000000000000000000000000000001";
const ADDRESS_THIS = "0x0000000000000000000000000000000000000002";

const kyberInterface = new Interface(KyberswapABI);
const openOceanInterface = new Interface(OpenOceanABI);
const uniInterface = new Interface(UniABI);
const magpieInterface = new Interface(MagpieABI);

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

const encodeV3Path = (tokenA: string, fee: number, tokenB: string) =>
  "0x" +
  tokenA.replace(/^0x/, "").toLowerCase() +
  fee.toString(16).padStart(6, "0") +
  tokenB.replace(/^0x/, "").toLowerCase();

const encodeUniV3ExactIn = (recipient: string, from = USER) => {
  const input = defaultAbiCoder.encode(
    ["address", "uint256", "uint256", "bytes", "bool"],
    [recipient, "1000", "900", encodeV3Path(TOKEN_IN, 3000, TOKEN_OUT), true]
  );
  return {
    from,
    to: USER,
    data: uniInterface.encodeFunctionData("execute(bytes,bytes[],uint256)", [
      "0x00",
      [input],
      9999999999,
    ]),
    value: "0x0",
    chainId: 1,
  };
};

const encodeUniUnwrap = (recipient: string) => {
  const swapInput = defaultAbiCoder.encode(
    ["address", "uint256", "uint256", "bytes", "bool"],
    [
      ADDRESS_THIS,
      "1000",
      "900",
      encodeV3Path(TOKEN_IN, 3000, WETH),
      true,
    ]
  );
  const unwrapInput = defaultAbiCoder.encode(
    ["address", "uint256"],
    [recipient, "800"]
  );
  return {
    from: USER,
    to: USER,
    data: uniInterface.encodeFunctionData("execute(bytes,bytes[],uint256)", [
      "0x000c",
      [swapInput, unwrapInput],
      9999999999,
    ]),
    value: "0x0",
    chainId: 1,
  };
};

const encodeUniSwapProxy = (recipient: string) => {
  const input = defaultAbiCoder.encode(
    ["address", "uint256", "uint256", "bytes", "bool"],
    [recipient, "1000", "900", encodeV3Path(TOKEN_IN, 3000, TOKEN_OUT), false]
  );
  return {
    from: USER,
    to: USER,
    data: uniInterface.encodeFunctionData(
      "execute(address,address,uint256,bytes,bytes[],uint256)",
      [
        "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af",
        TOKEN_IN,
        "1000",
        "0x00",
        [input],
        9999999999,
      ]
    ),
    value: "0x0",
    chainId: 1,
  };
};

const encodeUniV4Take = (recipient: string) => {
  const swapParams = defaultAbiCoder.encode(
    [
      "tuple(address,address,uint24,int24,address)",
      "bool",
      "uint128",
      "uint128",
      "bytes",
    ],
    [[TOKEN_IN, TOKEN_OUT, 3000, 60, NULL_ADDRESS], true, "1000", "900", "0x"]
  );
  const takeParams = defaultAbiCoder.encode(
    ["address", "address", "uint256"],
    [TOKEN_OUT, recipient, 0]
  );
  const v4Input = defaultAbiCoder.encode(
    ["bytes", "bytes[]"],
    ["0x060e", [swapParams, takeParams]]
  );
  return {
    from: USER,
    to: USER,
    data: uniInterface.encodeFunctionData("execute(bytes,bytes[],uint256)", [
      "0x10",
      [v4Input],
      9999999999,
    ]),
    value: "0x0",
    chainId: 1,
  };
};

const encodeMagpieSwap = ({
  toAddress,
  fromAsset = TOKEN_IN,
  toAsset = TOKEN_OUT,
  amountIn = "1000",
  amountOutMin = "900",
  from = USER,
}: {
  toAddress: string;
  fromAsset?: string;
  toAsset?: string;
  amountIn?: string;
  amountOutMin?: string;
  from?: string;
}) => {
  const packed = Buffer.alloc(320);
  const writeAddr = (offset: number, addr: string) => {
    Buffer.from(addr.replace(/^0x/, "").padStart(40, "0"), "hex").copy(
      packed,
      offset
    );
  };
  const writeU256 = (offset: number, value: string) => {
    Buffer.from(new BigNumber(value).toString(16).padStart(64, "0"), "hex").copy(
      packed,
      offset
    );
  };
  writeAddr(4, toAddress);
  writeAddr(24, fromAsset);
  writeAddr(44, toAsset);

  const packedStart = 68;
  packed.writeUInt16BE(packedStart + 160, 65);
  packed.writeUInt16BE(packedStart + 192, 68);
  packed.writeUInt16BE(packedStart + 224, 71);
  packed.writeUInt16BE(packedStart + 256, 74);
  writeU256(160, "9999999999");
  writeU256(192, amountOutMin);
  writeU256(224, "0");
  writeU256(256, amountIn);

  return {
    from,
    to: USER,
    data: magpieInterface.encodeFunctionData("swapWithMagpieSignature", [
      "0x" + packed.toString("hex"),
    ]),
    value: "0x0",
    chainId: 1,
  };
};

describe("Uni calldata receiver", () => {
  it("returns the encoded V3 recipient instead of tx.from", () => {
    const res = decodeCalldata(DEX_ENUM.UNI, encodeUniV3ExactIn(ATTACKER));

    expect(isSameAddress(res!.toTokenReceiver, ATTACKER)).toBe(true);
    expect(isSameAddress(res!.fromToken, TOKEN_IN)).toBe(true);
    expect(res!.fromTokenAmount).toBe("1000");
    expect(isSameAddress(res!.toToken, TOKEN_OUT)).toBe(true);
    expect(res!.minReceiveToTokenAmount).toBe("900");
    expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
      false
    );
  });

  it("maps MSG_SENDER to tx.from", () => {
    const res = decodeCalldata(DEX_ENUM.UNI, encodeUniV3ExactIn(MSG_SENDER));

    expect(isSameAddress(res!.toTokenReceiver, USER)).toBe(true);
    expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
      true
    );
  });

  it("uses UNWRAP_WETH recipient after a swap to the router", () => {
    const res = decodeCalldata(DEX_ENUM.UNI, encodeUniUnwrap(ATTACKER));

    expect(isSameAddress(res!.toTokenReceiver, ATTACKER)).toBe(true);
    expect(isSameAddress(res!.toToken, ETH_NATIVE)).toBe(true);
    expect(res!.minReceiveToTokenAmount).toBe("800");
    expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
      false
    );
  });

  it("keeps native fromToken after WRAP_ETH plus a WETH path swap", () => {
    const wrapInput = defaultAbiCoder.encode(
      ["address", "uint256"],
      [ADDRESS_THIS, "1000"]
    );
    const swapInput = defaultAbiCoder.encode(
      ["address", "uint256", "uint256", "bytes", "bool"],
      [
        ATTACKER,
        "1000",
        "900",
        encodeV3Path(WETH, 3000, TOKEN_IN),
        false,
      ]
    );
    const res = decodeCalldata(DEX_ENUM.UNI, {
      from: USER,
      to: USER,
      data: uniInterface.encodeFunctionData("execute(bytes,bytes[],uint256)", [
        "0x0b00",
        [wrapInput, swapInput],
        9999999999,
      ]),
      value: "0x0",
      chainId: 1,
    });

    expect(isSameAddress(res!.fromToken, ETH_NATIVE)).toBe(true);
    expect(isSameAddress(res!.toToken, TOKEN_IN)).toBe(true);
    expect(isSameAddress(res!.toTokenReceiver, ATTACKER)).toBe(true);
    expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
      false
    );
  });

  it("decodes SwapProxy execute the same way", () => {
    const res = decodeCalldata(DEX_ENUM.UNI, encodeUniSwapProxy(ATTACKER));

    expect(isSameAddress(res!.toTokenReceiver, ATTACKER)).toBe(true);
    expect(isSameAddress(res!.fromToken, TOKEN_IN)).toBe(true);
    expect(res!.fromTokenAmount).toBe("1000");
    expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
      false
    );
  });

  it("returns the V4 TAKE recipient", () => {
    const res = decodeCalldata(DEX_ENUM.UNI, encodeUniV4Take(ATTACKER));

    expect(isSameAddress(res!.toTokenReceiver, ATTACKER)).toBe(true);
    expect(isSameAddress(res!.fromToken, TOKEN_IN)).toBe(true);
    expect(isSameAddress(res!.toToken, TOKEN_OUT)).toBe(true);
    expect(res!.minReceiveToTokenAmount).toBe("900");
    expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
      false
    );
  });
});

describe("Magpie calldata receiver", () => {
  it("returns the packed toAddress instead of tx.from", () => {
    const res = decodeCalldata(
      DEX_ENUM.MAGPIE,
      encodeMagpieSwap({ toAddress: ATTACKER })
    );

    expect(isSameAddress(res!.toTokenReceiver, ATTACKER)).toBe(true);
    expect(isSameAddress(res!.fromToken, TOKEN_IN)).toBe(true);
    expect(res!.fromTokenAmount).toBe("1000");
    expect(isSameAddress(res!.toToken, TOKEN_OUT)).toBe(true);
    expect(res!.minReceiveToTokenAmount).toBe("900");
    expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
      false
    );
  });

  it("returns the current account when it is the packed toAddress", () => {
    const res = decodeCalldata(
      DEX_ENUM.MAGPIE,
      encodeMagpieSwap({ toAddress: USER })
    );

    expect(isSameAddress(res!.toTokenReceiver, USER)).toBe(true);
    expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
      true
    );
  });

  it("normalizes address(0) toAddress to tx.from", () => {
    const res = decodeCalldata(
      DEX_ENUM.MAGPIE,
      encodeMagpieSwap({ toAddress: NULL_ADDRESS })
    );

    expect(isSameAddress(res!.toTokenReceiver, USER)).toBe(true);
    expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
      true
    );
  });

  it("maps native asset address(0) to the chain native token", () => {
    const res = decodeCalldata(
      DEX_ENUM.MAGPIE,
      encodeMagpieSwap({
        toAddress: USER,
        fromAsset: NULL_ADDRESS,
        toAsset: NULL_ADDRESS,
      })
    );

    expect(isSameAddress(res!.fromToken, ETH_NATIVE)).toBe(true);
    expect(isSameAddress(res!.toToken, ETH_NATIVE)).toBe(true);
  });
});
