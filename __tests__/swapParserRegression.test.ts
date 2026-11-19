import { Interface } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";
import { DEX_ENUM } from "../src/consts";
import { decodeCalldata } from "../src/quote";
import fixtures from "./fixtures/swap-calldata/swap-parser-regressions.json";

const { samples } = fixtures;
const evidence = fixtures.evidence.metadata;

const zero = "0x0000000000000000000000000000000000000000";
const other = "0x1111111111111111111111111111111111111111";
const abi = new Interface([
  "function ethUnoswap(uint256 minReturn,uint256 dex)",
  "function unoswap(uint256 token,uint256 amount,uint256 minReturn,uint256 dex)",
  "function unoswap2(uint256 token,uint256 amount,uint256 minReturn,uint256 dex,uint256 dex2)",
  "function exec(address operator,address token,uint256 amount,address target,bytes data)",
  "function execute((address recipient,address buyToken,uint256 minAmountOut) slippage,bytes[] actions,bytes32 zid)",
  "function UNISWAPV2(address recipient,address sellToken,uint256 ppm,address pool,uint24 swapInfo,uint256 amountOutMin)",
  "function BEBOP(address recipient,address sellToken,(uint256 expiry,address maker_address,uint256 maker_nonce,address maker_token,uint256 taker_amount,uint256 maker_amount,uint256 event_id_and_flags) order,(bytes signatureBytes,uint256 flags) makerSignature,uint256 amountOutMin)",
  "function BASIC(address sellToken,uint256 ppm,address pool,uint256 offset,bytes data)",
  "function swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)",
]);

const normalize = (result: ReturnType<typeof decodeCalldata>) =>
  result &&
  Object.fromEntries(
    Object.entries(result).map(([key, value]) => [key, value.toLowerCase()])
  );

const eth = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const sender = "0x1111111111111111111111111111111111111111";
const nativeIds: Record<number, string> = { 1: "eth", 10: "op", 42161: "arb" };

const curvePools = [
  ...evidence.legacy.curve.map((p) => ({ ...p, hasReceiver: false })),
  ...evidence.stableNg.pools.map((p) => ({ ...p, hasReceiver: true })),
];
const decode = (chainId: number, input: string, dex: BigNumber) =>
  normalize(
    decodeCalldata(DEX_ENUM.ONEINCH, {
      chainId,
      from: sender,
      to: "0x111111125421ca6dc452d289314280a0f8842a65",
      value: input === eth ? "100" : "0",
      data:
        input === eth
          ? abi.encodeFunctionData("ethUnoswap", [
              50,
              dex.or(BigNumber.from(1).shl(251)),
            ])
          : abi.encodeFunctionData("unoswap", [input, 100, 50, dex]),
    })
  );
const packCurve = (
  address: string,
  from: number,
  to: number,
  receiver: boolean,
  native: boolean
) =>
  [
    [253, 2],
    [184, receiver ? 2 : 0],
    [192, 8],
    [208, 8],
    [200, from],
    [216, to],
    [224, from],
    [232, to],
    [240, native ? 4 : receiver ? 16 : 0],
  ].reduce(
    (value, [shift, field]) => value.or(BigNumber.from(field).shl(shift)),
    BigNumber.from(address)
  );

describe("blocked swap paths", () => {
  it.each(samples)(
    "[$dex] decodes captured $index $name",
    ({ dex, tx, expected }) => {
      expect(normalize(decodeCalldata(dex as DEX_ENUM, tx))).toEqual(expected);
    }
  );

  describe("[1inch] registered pool metadata", () => {
    const routes = [
      "POLYGON: USDT → frxUSD",
      "POLYGON: frxUSD → USDT",
      "POLYGON: DAI → USDT",
      "ETH: USDT → USDC",
    ].map((prefix) => samples.find((s) => s.name.startsWith(prefix))!);

    it.each(routes)("rejects a different pool or chain for $name", (sample) => {
      const parsed = abi.parseTransaction(sample.tx);
      const args = [...parsed.args];
      args[3] = parsed.args.dex.add(1);
      expect(
        decodeCalldata(DEX_ENUM.ONEINCH, {
          ...sample.tx,
          data: abi.encodeFunctionData(parsed.name, args),
        })
      ).toBeNull();
      expect(
        decodeCalldata(DEX_ENUM.ONEINCH, { ...sample.tx, chainId: 56 })
      ).toBeNull();
    });

    it.each(routes.slice(0, 2))(
      "checks Curve receiver flag and coin indexes for $name",
      (sample) => {
        const parsed = abi.parseTransaction(sample.tx);
        for (const bit of [200, 224, 244]) {
          const args = [...parsed.args];
          args[3] = parsed.args.dex.xor(BigNumber.from(1).shl(bit));
          expect(
            decodeCalldata(DEX_ENUM.ONEINCH, {
              ...sample.tx,
              data: abi.encodeFunctionData(parsed.name, args),
            })
          ).toBeNull();
        }
      }
    );

    it("checks QuickSwap direction and both hops through FIDD", () => {
      for (const sample of routes.slice(2)) {
        const parsed = abi.parseTransaction(sample.tx);
        const args = [...parsed.args];
        args[3] = parsed.args.dex.xor(BigNumber.from(1).shl(247));
        expect(
          decodeCalldata(DEX_ENUM.ONEINCH, {
            ...sample.tx,
            data: abi.encodeFunctionData(parsed.name, args),
          })
        ).toBeNull();
        if (parsed.name === "unoswap2") {
          args[3] = parsed.args.dex;
          args[4] = parsed.args.dex2.add(1);
          expect(
            decodeCalldata(DEX_ENUM.ONEINCH, {
              ...sample.tx,
              data: abi.encodeFunctionData(parsed.name, args),
            })
          ).toBeNull();
        }
      }
    });
  });

  describe("[1inch] native Curve input", () => {
    const sample = samples.find((s) => s.kind === "ethUnoswap")!;
    const args = abi.parseTransaction(sample.tx).args;
    const withDex = (dex: BigNumber) => ({
      ...sample.tx,
      data: abi.encodeFunctionData("ethUnoswap", [args.minReturn, dex]),
    });
    it.each([240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 251, 252])(
      "rejects inconsistent native conversion bit %s",
      (bit) => {
        expect(
          decodeCalldata(
            DEX_ENUM.ONEINCH,
            withDex(args.dex.xor(BigNumber.from(1).shl(bit)))
          )
        ).toBeNull();
      }
    );
    it("rejects unknown pool, wrong chain and empty native amount", () => {
      expect(
        decodeCalldata(DEX_ENUM.ONEINCH, withDex(args.dex.add(1)))
      ).toBeNull();
      expect(
        decodeCalldata(DEX_ENUM.ONEINCH, { ...sample.tx, chainId: 56 })
      ).toBeNull();
      expect(
        decodeCalldata(DEX_ENUM.ONEINCH, { ...sample.tx, value: "0" })
      ).toBeNull();
    });
  });

  describe.each(["BEBOP", "BASIC", "UNISWAPV2"])("[0xAPIV2] %s", (kind) => {
    const sample = samples.find((s) => s.kind === kind)!;
    const outer = abi.parseTransaction(sample.tx).args;
    const inner = abi.parseTransaction({ data: outer.data }).args;
    const last = abi.parseTransaction({
      data: inner.actions[inner.actions.length - 1],
    });
    const wrap = (args: unknown[]) => ({
      ...sample.tx,
      data: abi.encodeFunctionData("exec", [
        outer.operator,
        outer.token,
        outer.amount,
        outer.target,
        abi.encodeFunctionData("execute", [
          inner.slippage,
          [...inner.actions.slice(0, -1), abi.encodeFunctionData(kind, args)],
          inner.zid,
        ]),
      ]),
    });
    const mutate = (index: number, value: unknown) => {
      const args = [...last.args];
      args[index] = value;
      return wrap(args);
    };
    const withPayout = (recipient: string, min: string) => {
      const args = [...last.args];
      if (kind === "BASIC") {
        const nested = [...abi.parseTransaction({ data: args[4] }).args];
        nested[3] = recipient;
        nested[1] = min;
        args[4] = abi.encodeFunctionData("swapExactTokensForTokens", nested);
      } else {
        args[0] = recipient;
        args[args.length - 1] = min;
      }
      return wrap(args);
    };
    it("reads the actual recipient and rejects zero recipient/minimum", () => {
      const min = sample.expected.minReceiveToTokenAmount;
      expect(
        decodeCalldata(
          DEX_ENUM.ZEROXAPIV2,
          withPayout(other, min)
        )?.toTokenReceiver.toLowerCase()
      ).toBe(other);
      expect(
        decodeCalldata(DEX_ENUM.ZEROXAPIV2, withPayout(zero, min))
      ).toBeNull();
      expect(
        decodeCalldata(DEX_ENUM.ZEROXAPIV2, withPayout(other, "0"))
      ).toBeNull();
    });
    it("rejects malformed terminal data", () => {
      const tx = {
        ...sample.tx,
        data: abi.encodeFunctionData("exec", [
          outer.operator,
          outer.token,
          outer.amount,
          outer.target,
          abi.encodeFunctionData("execute", [
            inner.slippage,
            [inner.actions[inner.actions.length - 1].slice(0, 18)],
            inner.zid,
          ]),
        ]),
      };
      expect(decodeCalldata(DEX_ENUM.ZEROXAPIV2, tx)).toBeNull();
    });
    if (kind === "BEBOP") {
      it("rejects native flags, zero output and zero taker amount", () => {
        for (const [index, value] of [
          [6, BigNumber.from(1).shl(249)],
          [3, zero],
          [4, 0],
        ] as const) {
          const order = [...last.args.order];
          order[index] = value;
          expect(
            decodeCalldata(DEX_ENUM.ZEROXAPIV2, mutate(2, order))
          ).toBeNull();
        }
      });
    } else {
      it.each(kind === "UNISWAPV2" ? [1000001] : [0, 1000001])(
        "rejects invalid ppm %s",
        (ppm) => {
          expect(
            decodeCalldata(
              DEX_ENUM.ZEROXAPIV2,
              mutate(kind === "BASIC" ? 1 : 2, ppm)
            )
          ).toBeNull();
        }
      );
      it("rejects an unknown target and wrong chain", () => {
        expect(
          decodeCalldata(
            DEX_ENUM.ZEROXAPIV2,
            mutate(kind === "BASIC" ? 2 : 3, other)
          )
        ).toBeNull();
        expect(
          decodeCalldata(DEX_ENUM.ZEROXAPIV2, { ...sample.tx, chainId: 137 })
        ).toBeNull();
      });
    }
    if (kind === "BASIC") {
      it.each([0, 36, 100])(
        "rejects overwriting a non-input word at %s",
        (offset) => {
          expect(
            decodeCalldata(DEX_ENUM.ZEROXAPIV2, mutate(3, offset))
          ).toBeNull();
        }
      );
      it("rejects unknown wrapper endpoints and inconsistent sell token", () => {
        const originalPath = abi.parseTransaction({ data: last.args.data }).args
          .path;
        for (const path of [
          [other, originalPath[1]],
          [originalPath[0], other],
          [other],
          [zero, zero],
        ]) {
          const nested = [
            ...abi.parseTransaction({ data: last.args.data }).args,
          ];
          nested[2] = path;
          expect(
            decodeCalldata(
              DEX_ENUM.ZEROXAPIV2,
              mutate(
                4,
                abi.encodeFunctionData("swapExactTokensForTokens", nested)
              )
            )
          ).toBeNull();
        }
        expect(
          decodeCalldata(DEX_ENUM.ZEROXAPIV2, mutate(0, other))
        ).toBeNull();
        expect(
          decodeCalldata(DEX_ENUM.ZEROXAPIV2, mutate(4, "0xdeadbeef"))
        ).toBeNull();
      });
    }
    if (kind === "UNISWAPV2") {
      it("decodes a prepaid terminal pool with zero ppm", () => {
        expect(
          normalize(decodeCalldata(DEX_ENUM.ZEROXAPIV2, mutate(2, 0)))
        ).toEqual(sample.expected);
      });

      it("rejects wrong pool direction and sell token", () => {
        expect(
          decodeCalldata(DEX_ENUM.ZEROXAPIV2, mutate(4, last.args.swapInfo ^ 1))
        ).toBeNull();
        expect(
          decodeCalldata(DEX_ENUM.ZEROXAPIV2, mutate(1, other))
        ).toBeNull();
      });
    }
  });
});

describe("[1inch] official metadata expansion (constructed calldata)", () => {
  it("uses the verified WBTC candidate on a V3 route", () => {
    const pool = evidence.additionalV3Checks.pools[1];
    const dex = BigNumber.from(pool.pool).or(BigNumber.from(1).shl(253));
    expect(decode(1, pool.token1, dex)).toEqual({
      fromToken: pool.token1,
      fromTokenAmount: "100",
      toToken: pool.token0,
      minReceiveToTokenAmount: "50",
      toTokenReceiver: sender,
    });
  });
  it.each(curvePools)(
    "decodes all coin directions for $chainId $name $address",
    (pool) => {
      for (let from = 0; from < pool.coins.length; from++) {
        for (let to = 0; to < pool.coins.length; to++) {
          if (from === to) continue;
          const input = pool.coins[from],
            output = pool.coins[to];
          const native = input === eth || output === eth;
          for (const receiver of pool.hasReceiver ? [false, true] : [false]) {
            const dex = packCurve(pool.address, from, to, receiver, native);
            expect(decode(pool.chainId, input, dex)).toEqual({
              fromToken: input === eth ? nativeIds[pool.chainId] : input,
              fromTokenAmount: "100",
              toToken: output === eth ? nativeIds[pool.chainId] : output,
              minReceiveToTokenAmount: "50",
              toTokenReceiver: sender,
            });
          }
        }
      }
    }
  );

  it.each(curvePools)(
    "rejects inconsistent metadata for $chainId $address",
    (pool) => {
      const native = pool.coins.includes(eth);
      const dex = packCurve(pool.address, 0, 1, false, native);
      expect(decode(56, pool.coins[0], dex)).toBeNull();
      expect(decode(pool.chainId, pool.coins[0], dex.add(1))).toBeNull();
      expect(
        decode(pool.chainId, pool.coins[0], dex.xor(BigNumber.from(1).shl(216)))
      ).toBeNull();
      if (!pool.hasReceiver) {
        expect(
          decode(
            pool.chainId,
            pool.coins[0],
            packCurve(pool.address, 0, 1, true, native)
          )
        ).toBeNull();
      }
    }
  );

  it.each(evidence.legacy.factories)(
    "derives Sushi pools on chain $chainId",
    (pool) => {
      for (const reverse of [false, true]) {
        const input = reverse ? pool.token1 : pool.token0;
        const output = reverse ? pool.token0 : pool.token1;
        const dex = BigNumber.from(pool.pair).or(
          BigNumber.from(reverse ? 0 : 1).shl(247)
        );
        expect(decode(pool.chainId, input, dex)).toEqual({
          fromToken: input,
          fromTokenAmount: "100",
          toToken: output,
          minReceiveToTokenAmount: "50",
          toTokenReceiver: sender,
        });
        expect(
          decode(pool.chainId, input, dex.xor(BigNumber.from(1).shl(247)))
        ).toBeNull();
        expect(decode(pool.chainId, input, dex.add(1))).toBeNull();
      }
    }
  );
});
