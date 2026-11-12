import { Interface } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";
import { DEX_ENUM } from "../src/consts";
import { decodeCalldata } from "../src/quote";

const abi = new Interface([
  "function unoswap(uint256 token,uint256 amount,uint256 minReturn,uint256 dex)",
  "function unoswap2(uint256 token,uint256 amount,uint256 minReturn,uint256 dex,uint256 dex2)",
  "function unoswap3(uint256 token,uint256 amount,uint256 minReturn,uint256 dex,uint256 dex2,uint256 dex3)",
  "function ethUnoswap2(uint256 minReturn,uint256 dex,uint256 dex2)",
]);
const usdt = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const crvusd = "0xf939e0a03fb07f59a73314e73794be0e57ac1b4e";
const sender = "0x1111111111111111111111111111111111111111";
// User-supplied ETH quote, not a mined transaction. Sender is a placeholder.
// Pool identity and coins(0/1) independently checked on-chain on 2026-11-10.
const data =
  "0x83800a8e000000000000000000000000f939e0a03fb07f59a73314e73794be0e57ac1b4e00000000000000000000000000000000000000000000000002c68af0bb1400000000000000000000000000000000000000000000000000000000000000030909480000010008010800000000390f3595bca2df7d23783dfd126427cceb997bf42a6f45f2";
const tx = {
  chainId: 1,
  from: sender,
  to: "0x111111125421ca6dc452d289314280a0f8842a65",
  value: "0",
  data,
};
const original = abi.parseTransaction(tx).args;
const dex: BigNumber = original.dex;
const withByte = (value: BigNumber, offset: number, byte: number) =>
  value
    .xor(value.shr(offset).and(255).shl(offset))
    .or(BigNumber.from(byte).shl(offset));
const encode = (pool: BigNumber, input = crvusd) => ({
  ...tx,
  data: abi.encodeFunctionData("unoswap", [
    input,
    original.amount,
    original.minReturn,
    pool,
  ]),
});
const decoded = (sample = tx) => {
  const result = decodeCalldata(DEX_ENUM.ONEINCH, sample);
  return (
    result &&
    Object.fromEntries(
      Object.entries(result).map(([key, value]) => [key, value.toLowerCase()])
    )
  );
};
const expected = {
  fromToken: crvusd,
  fromTokenAmount: "200000000000000000",
  toToken: usdt,
  minReceiveToTokenAmount: "198921",
  toTokenReceiver: sender,
};

// Ethereum getPool(WETH, USDT, 3000), also recorded in oneinch-deployment-check.json.
// These mixed routes are constructed parser tests, not historical transactions.
const weth = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const usdtToWeth = BigNumber.from(
  "0x4e68ccd3e89f51c3074ca5072bbac773960dfa36"
).or(BigNumber.from(1).shl(253));
const wethToUsdt = usdtToWeth.or(BigNumber.from(1).shl(247));
const reverseCurve = [
  [200, 0],
  [216, 1],
  [224, 0],
  [232, 1],
].reduce((value, [offset, byte]) => withByte(value, offset, byte), dex);

describe("[1inch] Curve decoding only", () => {
  it("decodes the exact reported crvUSD/USDT quote", () => {
    expect(decoded()).toEqual(expected);
  });

  it.each([false, true])(
    "decodes both directions with receiver argument %s",
    (receiver) => {
      const forward = receiver
        ? withByte(dex, 184, 2).or(BigNumber.from(1).shl(244))
        : dex;
      const reverse = [
        [200, 0],
        [216, 1],
        [224, 0],
        [232, 1],
      ].reduce(
        (value, [offset, byte]) => withByte(value, offset, byte),
        forward
      );
      expect(decoded(encode(forward))).toEqual(expected);
      expect(decoded(encode(reverse, usdt))).toEqual({
        ...expected,
        fromToken: usdt,
        toToken: crvusd,
      });
    }
  );

  it("resolves consecutive Curve hops using the previous output", () => {
    const reverse = [
      [200, 0],
      [216, 1],
      [224, 0],
      [232, 1],
    ].reduce((value, [offset, byte]) => withByte(value, offset, byte), dex);
    expect(
      decoded({
        ...tx,
        data: abi.encodeFunctionData("unoswap2", [
          crvusd,
          original.amount,
          original.minReturn,
          dex,
          reverse,
        ]),
      })
    ).toEqual({ ...expected, toToken: crvusd });
  });

  it.each([false, true])(
    "walks Curve -> V3 with native unwrap %s",
    (unwrap) => {
      expect(
        decoded({
          ...tx,
          data: abi.encodeFunctionData("unoswap2", [
            crvusd,
            original.amount,
            original.minReturn,
            dex,
            unwrap ? usdtToWeth.or(BigNumber.from(1).shl(252)) : usdtToWeth,
          ]),
        })
      ).toEqual({ ...expected, toToken: unwrap ? "eth" : weth });
    }
  );

  it("walks native input -> V3 -> Curve", () => {
    expect(
      decoded({
        ...tx,
        value: original.amount.toString(),
        data: abi.encodeFunctionData("ethUnoswap2", [
          original.minReturn,
          wethToUsdt,
          reverseCurve,
        ]),
      })
    ).toEqual({ ...expected, fromToken: "eth", toToken: crvusd });
  });

  it("walks a three-hop Curve -> V3 -> V3 route", () => {
    expect(
      decoded({
        ...tx,
        data: abi.encodeFunctionData("unoswap3", [
          crvusd,
          original.amount,
          original.minReturn,
          dex,
          usdtToWeth,
          wethToUsdt,
        ]),
      })
    ).toEqual(expected);
  });

  it.each([
    ["unknown later pool", usdtToWeth.add(1)],
    ["disconnected Curve input", dex],
    ["wrong V3 direction", wethToUsdt],
  ] as const)("rejects the whole route for %s", (_, last) => {
    expect(
      decoded({
        ...tx,
        data: abi.encodeFunctionData("unoswap2", [
          crvusd,
          original.amount,
          original.minReturn,
          dex,
          last,
        ]),
      })
    ).toBeNull();
  });

  it.each([2, 255])("rejects out-of-bounds input index %s", (index) => {
    expect(
      decoded(encode(withByte(withByte(dex, 200, index), 224, index)))
    ).toBeNull();
  });

  it.each([
    ["unsupported swap selector", 184, 1],
    ["receiver overload without receiver flag", 184, 2],
    ["different input getter", 192, 0],
    ["underlying output getter", 208, 4],
    ["input getter/swap index mismatch", 200, 0],
    ["output getter/swap index mismatch", 216, 1],
    ["input swap/getter index mismatch", 224, 0],
    ["output swap/getter index mismatch", 232, 1],
  ] as const)("rejects %s", (_, offset, value) => {
    expect(decoded(encode(withByte(dex, offset, value)))).toBeNull();
  });

  it.each([240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 252])(
    "rejects unsupported or inconsistent flag at bit %s",
    (bit) => {
      expect(decoded(encode(dex.or(BigNumber.from(1).shl(bit))))).toBeNull();
    }
  );

  it.each([1, 2, 255])(
    "rejects identical or out-of-bounds output index %s",
    (index) => {
      expect(
        decoded(encode(withByte(withByte(dex, 216, index), 232, index)))
      ).toBeNull();
    }
  );

  it("rejects an unknown pool, wrong chain and wrong input token", () => {
    expect(decoded(encode(dex.add(1)))).toBeNull();
    expect(decoded({ ...tx, chainId: 56 })).toBeNull();
    expect(decoded(encode(dex, usdt))).toBeNull();
  });
});
