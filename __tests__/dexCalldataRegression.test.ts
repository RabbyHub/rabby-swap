import { Interface } from "@ethersproject/abi";
import { decodeCalldata, verifySdk, DEX_ENUM } from "../src";
import { otherDexParamsFor } from "./otherDexFixtures";
import regressions from "./fixtures/swap-calldata/oct26-regressions.json";

type Sample = Parameters<typeof otherDexParamsFor>[0];
const samples = regressions.valid as Sample[];
const invalidTempo = regressions.invalidTempo as Omit<Sample, "expected">[];
const zero = "0x0000000000000000000000000000000000000000";
const other = "0x1111111111111111111111111111111111111111";
const inch = new Interface([
  "function unoswap(uint256 token,uint256 amount,uint256 minReturn,uint256 dex)",
]);
const wrapper = new Interface([
  "function exec(address operator,address token,uint256 amount,address target,bytes data)",
  "function execute((address recipient,address buyToken,uint256 minAmountOut) slippage,bytes[] actions,bytes32 affiliate)",
]);
const action = new Interface([
  "function UNISWAPV3(address recipient,uint256 ppm,bytes path,uint256 amountOutMin)",
]);
const toTx = (sample: Sample) => ({
  ...sample.record.quote.tx,
  chainId: sample.record.chainId,
});

describe("Oct26 recorded quote regressions", () => {
  it.each(samples)("$name", (sample) => {
    const decoded = decodeCalldata(sample.record.dex, toTx(sample));
    expect(decoded).not.toBeNull();
    expect(
      Object.fromEntries(
        Object.entries(decoded!).map(([key, value]) => [
          key,
          value.toLowerCase(),
        ])
      )
    ).toEqual(sample.expected);
    expect(verifySdk(otherDexParamsFor(sample))).toMatchObject({
      routerPass: true,
      spenderPass: true,
      callDataPass: true,
      receiverPass: true,
      isSdkDataPass: true,
    });
  });

  it.each(invalidTempo)(
    "rejects the original synthetic native-USD quote: $name",
    (sample) => {
      expect(verifySdk(otherDexParamsFor(sample as Sample))).toMatchObject({
        callDataPass: false,
        isSdkDataPass: false,
        receiverPass: true,
      });
    }
  );
});

describe("[1inch] unoswap pool and direction verification", () => {
  const sample = samples.find(({ record }) => record.dex === DEX_ENUM.ONEINCH)!;
  const tx = toTx(sample);
  const original = Array.from(inch.parseTransaction(tx).args);
  const encode = (values: unknown[]) => ({
    ...tx,
    data: inch.encodeFunctionData("unoswap", values),
  });

  it.each([
    { name: "unknown pool", field: 3, value: original[3].add(1) },
    { name: "wrong input asset", field: 0, value: other },
    {
      name: "wrong direction",
      field: 3,
      value: original[3].xor(
        "0x0080000000000000000000000000000000000000000000000000000000000000"
      ),
    },
    {
      name: "different protocol",
      field: 3,
      value: original[3].xor(
        "0x6000000000000000000000000000000000000000000000000000000000000000"
      ),
    },
    {
      name: "unsupported native unwrap",
      field: 3,
      value: original[3].or(
        "0x1000000000000000000000000000000000000000000000000000000000000000"
      ),
    },
    { name: "zero minimum", field: 2, value: 0 },
  ])("rejects $name", ({ field, value }) => {
    const args = [...original];
    args[field] = value;
    expect(decodeCalldata(DEX_ENUM.ONEINCH, encode(args))).toBeNull();
  });

  it("decodes the opposite direction of the same verified pool", () => {
    const args = [...original];
    args[0] = sample.expected.toToken;
    args[3] = original[3].xor(
      "0x0080000000000000000000000000000000000000000000000000000000000000"
    );
    const decoded = decodeCalldata(DEX_ENUM.ONEINCH, encode(args));
    expect(decoded?.fromToken.toLowerCase()).toBe(sample.expected.toToken);
    expect(decoded?.toToken.toLowerCase()).toBe(sample.expected.fromToken);
  });

  it("rejects value on the nonpayable entry and a missing sender", () => {
    expect(decodeCalldata(DEX_ENUM.ONEINCH, { ...tx, value: "1" })).toBeNull();
    expect(decodeCalldata(DEX_ENUM.ONEINCH, { ...tx, from: zero })).toBeNull();
  });
});

describe("[0xAPIV2] terminal action output constraints", () => {
  const sample = samples.find(
    ({ record }) => record.dex === DEX_ENUM.ZEROXAPIV2
  )!;
  const tx = toTx(sample);
  const outer = wrapper.parseTransaction(tx).args;
  const inner = wrapper.parseTransaction({ data: outer.data }).args;
  const actions = [...inner.actions] as string[];
  const last = action.parseTransaction({ data: actions[actions.length - 1] })
    .args;
  const wrap = (updated: string[], slippage: unknown[] = [zero, zero, 0]) => ({
    ...tx,
    data: wrapper.encodeFunctionData("exec", [
      outer.operator,
      outer.token,
      outer.amount,
      outer.target,
      wrapper.encodeFunctionData("execute", [
        slippage,
        updated,
        inner.affiliate,
      ]),
    ]),
  });
  const terminal = (
    recipient = last.recipient,
    minimum = last.amountOutMin,
    path = last.path
  ) =>
    action.encodeFunctionData("UNISWAPV3", [
      recipient,
      last.ppm,
      path,
      minimum,
    ]);

  it.each([
    { name: "empty actions", values: [] },
    { name: "unrecognized final action", values: [...actions, "0xdeadbeef"] },
    {
      name: "zero recipient",
      values: [...actions.slice(0, -1), terminal(zero)],
    },
    {
      name: "zero minimum",
      values: [...actions.slice(0, -1), terminal(last.recipient, 0)],
    },
    {
      name: "truncated path",
      values: [
        ...actions.slice(0, -1),
        terminal(last.recipient, last.amountOutMin, "0x1234"),
      ],
    },
    {
      name: "zero output asset",
      values: [
        ...actions.slice(0, -1),
        terminal(
          last.recipient,
          last.amountOutMin,
          last.path.slice(0, -40) + zero.slice(2)
        ),
      ],
    },
  ])("rejects $name", ({ values }) => {
    expect(decodeCalldata(DEX_ENUM.ZEROXAPIV2, wrap(values))).toBeNull();
  });

  it("checks the actual terminal recipient even if the ignored outer tuple names the user", () => {
    const params = otherDexParamsFor(sample);
    const updated = wrap(
      [...actions.slice(0, -1), terminal(other)],
      [sample.record.request.userAddress, zero, 0]
    );
    expect(
      verifySdk({ ...params, data: { ...params.data!, tx: updated } })
    ).toMatchObject({
      callDataPass: true,
      receiverPass: false,
      isSdkDataPass: false,
    });
  });

  it("keeps nonempty outer constraints and rejects their zero recipient", () => {
    const slippage = [
      last.recipient,
      sample.expected.toToken,
      last.amountOutMin,
    ];
    expect(
      decodeCalldata(DEX_ENUM.ZEROXAPIV2, wrap(actions, slippage))
        ?.toTokenReceiver
    ).toBe(last.recipient);
    expect(
      decodeCalldata(
        DEX_ENUM.ZEROXAPIV2,
        wrap(actions, [zero, sample.expected.toToken, last.amountOutMin])
      )
    ).toBeNull();
  });
});
