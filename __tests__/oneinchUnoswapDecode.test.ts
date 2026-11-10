import { Interface } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";
import { DEX_ENUM } from "../src/consts";
import { decodeCalldata } from "../src/quote";

const router = "0x111111125421ca6dc452d289314280a0f8842a65";
const sender = "0x1111111111111111111111111111111111111111";
const usdt = "0x55d398326f99059ff775485246999027b3197955";
const usdc = "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d";
const wethBase = "0x4200000000000000000000000000000000000006";
const usdcBase = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const amount = "200000000000000000";
const minimum = "198849285252576062";
const abi = new Interface([
  "function unoswap(uint256 token,uint256 amount,uint256 minReturn,uint256 dex)",
  "function unoswap2(uint256 token,uint256 amount,uint256 minReturn,uint256 dex,uint256 dex2)",
  "function unoswap3(uint256 token,uint256 amount,uint256 minReturn,uint256 dex,uint256 dex2,uint256 dex3)",
  "function ethUnoswap(uint256 minReturn,uint256 dex)",
  "function ethUnoswap2(uint256 minReturn,uint256 dex,uint256 dex2)",
]);
const decode = (data: string, chainId = 56, value = "0") =>
  decodeCalldata(DEX_ENUM.ONEINCH, {
    chainId,
    data,
    value,
    to: router,
    from: sender,
  });
const normalize = (result: ReturnType<typeof decode>) =>
  result &&
  Object.fromEntries(
    Object.entries(result).map(([key, value]) => [key, value.toLowerCase()])
  );
const expected = (fromToken: string, toToken: string) => ({
  fromToken,
  toToken,
  fromTokenAmount: amount,
  minReceiveToTokenAmount: minimum,
  toTokenReceiver: sender,
});

// User-supplied quote, not a mined transaction; the sender was not supplied.
const reportedData =
  "0x83800a8e00000000000000000000000055d398326f99059ff775485246999027b319795500000000000000000000000000000000000000000000000002c68af0bb14000000000000000000000000000000000000000000000000000002c2745f1351f33e08800000000000003b7c458085f8628bfff75d08f1aa415e5c7e85d96bfd7f572a6f45f2";

// Real pools read with getPair/getPool on 2026-11-10 via
// https://bsc-rpc.publicnode.com and https://base-rpc.publicnode.com.
// Calls below are encoded test inputs, not historical transaction fixtures.
const pools = [
  {
    name: "BSC Pancake V1",
    chainId: 56,
    protocol: 0,
    feeNumerator: 998000000,
    factory: "0xbcfccbde45ce874adcb698cc183debcf17952812",
    pool: "0x85f8628bfff75d08f1aa415e5c7e85d96bfd7f57",
    input: usdt,
    output: usdc,
  },
  {
    name: "BSC Pancake V2",
    chainId: 56,
    protocol: 0,
    feeNumerator: 997500000,
    factory: "0xca143ce32fe78f1f7019d7d551a6402fc5350c73",
    pool: "0xec6557348085aa57c72514d67070dc863c0a5a8c",
    input: usdt,
    output: usdc,
  },
  {
    name: "BSC Uniswap V2",
    chainId: 56,
    protocol: 0,
    feeNumerator: 997000000,
    factory: "0x8909dc15e40173ff4699343b6eb8132c65e18ec6",
    pool: "0x6ab0ae46c4b450bc1b4ffcaa192b235134d584b2",
    input: usdt,
    output: usdc,
  },
  {
    name: "BSC Uniswap V3 fee 500",
    chainId: 56,
    protocol: 1,
    feeNumerator: 0,
    factory: "0xdb1d10011ad0ff90774d0c6bb92e5c5c8b4461f7",
    pool: "0xccdfcd1aac447d5b29980f64b831c532a6a33726",
    input: usdt,
    output: usdc,
  },
  {
    name: "Base Uniswap V2",
    chainId: 8453,
    protocol: 0,
    feeNumerator: 997000000,
    factory: "0x8909dc15e40173ff4699343b6eb8132c65e18ec6",
    pool: "0x88a43bbdf9d098eec7bceda4e2494615dfd9bb9c",
    input: wethBase,
    output: usdcBase,
  },
  {
    name: "Base Uniswap V3 fee 500",
    chainId: 8453,
    protocol: 1,
    feeNumerator: 0,
    factory: "0x33128a8fc17869897dce68ed026d694621f6fdfd",
    pool: "0xd0b53d9277642d899df5c87a3966a349a798f224",
    input: wethBase,
    output: usdcBase,
  },
];
const direction = BigNumber.from(1).shl(247);
const dexFor = (sample: (typeof pools)[number]) =>
  BigNumber.from(sample.pool)
    .or(BigNumber.from(sample.protocol).shl(253))
    .or(BigNumber.from(sample.feeNumerator).shl(160))
    .or(sample.input < sample.output ? direction : 0);

describe("[1inch] chain-specific unoswap decoding only", () => {
  it("decodes the exact reported BSC Pancake V1 quote", () => {
    expect(normalize(decode(reportedData))).toEqual(expected(usdt, usdc));
  });

  it.each(pools)("decodes $name in both directions", (sample) => {
    const dex = dexFor(sample);
    expect(
      normalize(
        decode(
          abi.encodeFunctionData("unoswap", [
            sample.input,
            amount,
            minimum,
            dex,
          ]),
          sample.chainId
        )
      )
    ).toEqual(expected(sample.input, sample.output));
    expect(
      normalize(
        decode(
          abi.encodeFunctionData("unoswap", [
            sample.output,
            amount,
            minimum,
            dex.xor(direction),
          ]),
          sample.chainId
        )
      )
    ).toEqual(expected(sample.output, sample.input));
  });

  it.each(pools)(
    "rejects unknown pools and wrong direction for $name",
    (sample) => {
      for (const dex of [
        dexFor(sample).add(1),
        dexFor(sample).xor(direction),
      ]) {
        expect(
          decode(
            abi.encodeFunctionData("unoswap", [
              sample.input,
              amount,
              minimum,
              dex,
            ]),
            sample.chainId
          )
        ).toBeNull();
      }
    }
  );

  it.each([1, 8453, 43114])("rejects the BSC quote on chain %s", (chainId) => {
    expect(decode(reportedData, chainId)).toBeNull();
  });

  it("walks a mixed Pancake V1 / Uniswap V3 route", () => {
    expect(
      normalize(
        decode(
          abi.encodeFunctionData("unoswap2", [
            usdt,
            amount,
            minimum,
            dexFor(pools[0]),
            dexFor(pools[3]).xor(direction),
          ])
        )
      )
    ).toEqual(expected(usdt, usdt));
  });

  it("decodes native input and native output through the Base V3 pool", () => {
    const dex = dexFor(pools[5]);
    expect(
      normalize(
        decode(
          abi.encodeFunctionData("ethUnoswap", [minimum, dex]),
          8453,
          amount
        )
      )
    ).toEqual(expected("base", usdcBase));
    expect(
      normalize(
        decode(
          abi.encodeFunctionData("unoswap", [
            usdcBase,
            amount,
            minimum,
            dex.xor(direction).or(BigNumber.from(1).shl(252)),
          ]),
          8453
        )
      )
    ).toEqual(expected(usdcBase, "base"));
  });

  it("walks BSC Pancake V1 -> Pancake V2 -> Uniswap V3", () => {
    expect(
      normalize(
        decode(
          abi.encodeFunctionData("unoswap3", [
            usdt,
            amount,
            minimum,
            dexFor(pools[0]),
            dexFor(pools[1]).xor(direction),
            dexFor(pools[3]),
          ])
        )
      )
    ).toEqual(expected(usdt, usdc));
  });

  it("walks Base native input -> V3 -> V2 -> native output", () => {
    expect(
      normalize(
        decode(
          abi.encodeFunctionData("ethUnoswap2", [
            minimum,
            dexFor(pools[5]),
            dexFor(pools[4]).xor(direction).or(BigNumber.from(1).shl(252)),
          ]),
          8453,
          amount
        )
      )
    ).toEqual(expected("base", "base"));
  });

  it("rejects a route with a valid first pool but an unknown last pool", () => {
    expect(
      decode(
        abi.encodeFunctionData("unoswap2", [
          usdt,
          amount,
          minimum,
          dexFor(pools[0]),
          dexFor(pools[3]).xor(direction).add(1),
        ])
      )
    ).toBeNull();
  });

  it.each([3, 4, 5, 6, 7])("rejects unsupported protocol %s", (protocol) => {
    expect(
      decode(
        abi.encodeFunctionData("unoswap", [
          usdt,
          amount,
          minimum,
          dexFor(pools[0]).or(BigNumber.from(protocol).shl(253)),
        ])
      )
    ).toBeNull();
  });
});
