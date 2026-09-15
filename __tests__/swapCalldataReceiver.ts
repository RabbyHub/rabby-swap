import { Interface } from "@ethersproject/abi";
import { DEX_ENUM } from "../src/consts";
import { KyberswapABI, OpenOceanABI } from "../src/abi";
import { decodeCalldata } from "../src/quote";
import { NULL_ADDRESS, isSameAddress } from "../src/utils";

const USER = "0x1111111111111111111111111111111111111111";
const ATTACKER = "0x2222222222222222222222222222222222222222";
const TOKEN_IN = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const TOKEN_OUT = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

const kyberInterface = new Interface(KyberswapABI);
const openOceanInterface = new Interface(OpenOceanABI);

const encodeKyberSwap = (dstReceiver: string, from = USER) => {
  const data = kyberInterface.encodeFunctionData("swap", [
    {
      callTarget: USER,
      approveTarget: USER,
      targetData: "0x",
      desc: {
        srcToken: TOKEN_IN,
        dstToken: TOKEN_OUT,
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
    value: "0x0",
    chainId: 1,
  };
};

const encodeKyberSwapSimpleMode = (dstReceiver: string, from = USER) => {
  const data = kyberInterface.encodeFunctionData("swapSimpleMode", [
    USER,
    {
      srcToken: TOKEN_IN,
      dstToken: TOKEN_OUT,
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
    value: "0x0",
    chainId: 1,
  };
};

const encodeOpenOceanSwap = (dstReceiver: string, from = USER) => {
  const data = openOceanInterface.encodeFunctionData("swap", [
    USER,
    {
      srcToken: TOKEN_IN,
      dstToken: TOKEN_OUT,
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
    value: "0x0",
    chainId: 1,
  };
};

describe("KyberSwap calldata receiver", () => {
  it("returns the encoded dstReceiver instead of tx.from", () => {
    const res = decodeCalldata(DEX_ENUM.KYBERSWAP, encodeKyberSwap(ATTACKER));

    expect(isSameAddress(res!.toTokenReceiver, ATTACKER)).toBe(true);
    expect(isSameAddress(res!.toTokenReceiver, USER)).toBe(false);
  });

  it("returns the current account when it is the encoded dstReceiver", () => {
    const res = decodeCalldata(DEX_ENUM.KYBERSWAP, encodeKyberSwap(USER));

    expect(isSameAddress(res!.toTokenReceiver, USER)).toBe(true);
  });

  it("normalizes address(0) dstReceiver to tx.from", () => {
    const res = decodeCalldata(
      DEX_ENUM.KYBERSWAP,
      encodeKyberSwap(NULL_ADDRESS)
    );

    expect(isSameAddress(res!.toTokenReceiver, USER)).toBe(true);
  });

  it("returns the encoded dstReceiver for swapSimpleMode", () => {
    const res = decodeCalldata(
      DEX_ENUM.KYBERSWAP,
      encodeKyberSwapSimpleMode(ATTACKER)
    );

    expect(isSameAddress(res!.toTokenReceiver, ATTACKER)).toBe(true);
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
  });

  it("returns the current account when it is the encoded dstReceiver", () => {
    const res = decodeCalldata(DEX_ENUM.OPENOCEAN, encodeOpenOceanSwap(USER));

    expect(isSameAddress(res!.toTokenReceiver, USER)).toBe(true);
  });

  it("normalizes address(0) dstReceiver to tx.from", () => {
    const res = decodeCalldata(
      DEX_ENUM.OPENOCEAN,
      encodeOpenOceanSwap(NULL_ADDRESS)
    );

    expect(isSameAddress(res!.toTokenReceiver, USER)).toBe(true);
  });
});
