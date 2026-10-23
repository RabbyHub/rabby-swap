import type { CHAINS_ENUM } from "@debank/common";
import { defaultAbiCoder, Interface } from "@ethersproject/abi";
import BigNumber from "bignumber.js";
import { DEX_ENUM, decodeCalldata, verifyCalldata, verifySdk } from "../src";
import type {
  DecodeCalldataResult,
  TxWithChainId,
  VerifySdkParams,
} from "../src";
import type { QuoteResult } from "../src/quote";
import { UniABI } from "../src/abi";
import * as magpieFees from "../src/calldata/magpie/dexAggregator";
import uni from "./fixtures/swap-calldata/uni.json";
import magpie from "./fixtures/swap-calldata/magpie.json";
import { otherDexSamples, otherDexParamsFor } from "./otherDexFixtures";

type Fixture = {
  name: string;
  dexId: DEX_ENUM;
  nativeTokenAddress: string;
  tx: TxWithChainId;
  expected: DecodeCalldataResult;
  chain?: string;
  quote?: Pick<
    QuoteResult,
    "fromToken" | "fromTokenAmount" | "toToken" | "toTokenAmount" | "spender"
  >;
  slippage?: string;
  userAddress?: string;
  refundCommandIndex?: number;
  rootInputAmounts6?: string[];
};
const samples: Fixture[] = [
  ...uni.map((sample) => ({
    ...sample,
    name: `[Uniswap] ${sample.name}`,
    dexId: DEX_ENUM.UNI,
  })),
  ...magpie.map((sample) => ({
    ...sample,
    name: `[Magpie] ${sample.name}`,
    dexId: DEX_ENUM.MAGPIE,
  })),
];
const normalize = (decoded: DecodeCalldataResult) => ({
  ...decoded,
  fromToken: decoded.fromToken.toLowerCase(),
  toToken: decoded.toToken.toLowerCase(),
  toTokenReceiver: decoded.toTokenReceiver.toLowerCase(),
});
const uniInterface = new Interface(UniABI);
const otherUser = "0x1111111111111111111111111111111111111111";
const zero = "0x0000000000000000000000000000000000000000";

describe("Recorded other DEX calldata", () => {
  it.each(otherDexSamples)("decodes all five fields: $name", (sample) => {
    const { record } = sample;
    const result = decodeCalldata(record.dex, {
      ...record.quote.tx,
      chainId: record.chainId,
    });
    expect(result).not.toBeNull();
    expect(normalize(result!)).toEqual(sample.expected);
  });

  it.each(otherDexSamples)("verifies the original request: $name", (sample) => {
    const result = verifySdk(otherDexParamsFor(sample));
    // A skipped comparison after a null decode is not a successful verification.
    expect(result.decoded).not.toBeNull();
    expect(result.decodeFailure).toBeUndefined();
    expect(normalize(result.decoded!)).toEqual(sample.expected);
    expect(result.callDataPass).toBe(true);
    expect(result.receiverPass).toBe(true);
  });
});

describe("[Sushi] supported chain validation", () => {
  const sample = otherDexSamples.find(
    ({ record }) =>
      record.dex === DEX_ENUM.SUSHI &&
      record.quote.tx.data.startsWith("0x5f3bd1c8")
  )!;

  it.each([
    {
      name: "an unknown chain",
      chainId: 999999999,
    },
  ])("rejects $name", ({ chainId }) => {
    expect(
      decodeCalldata(DEX_ENUM.SUSHI, { ...sample.record.quote.tx, chainId })
    ).toBeNull();
  });
});

describe("Recorded Uni and Magpie calldata", () => {
  it.each(samples)("$name", (sample) => {
    const decoded = decodeCalldata(sample.dexId, sample.tx)!;
    expect(normalize(decoded)).toEqual(sample.expected);
    if (sample.rootInputAmounts6) {
      // Independently sum Arc's six-decimal route inputs before scaling.
      expect(
        sample.rootInputAmounts6
          .reduce((sum, amount) => sum.plus(amount), new BigNumber(0))
          .times("1000000000000")
          .toFixed(0)
      ).toBe(sample.expected.fromTokenAmount);
    }
    if (sample.refundCommandIndex !== undefined) {
      const parsed = uniInterface.parseTransaction(sample.tx);
      const commands = Array.from(
        Buffer.from(parsed.args.commands.slice(2), "hex")
      );
      const sweepIndex = commands.lastIndexOf(0x04);
      const [token, recipient, minimum] = defaultAbiCoder.decode(
        ["address", "address", "uint256"],
        parsed.args.inputs[sweepIndex]
      );
      expect(token.toLowerCase()).toBe(sample.expected.toToken);
      expect(recipient.toLowerCase()).toBe(sample.expected.toTokenReceiver);
      expect(minimum.toString()).toBe(sample.expected.minReceiveToTokenAmount);
      expect(commands[sample.refundCommandIndex]).toBe(0x0c);
      const [, refundMinimum] = defaultAbiCoder.decode(
        ["address", "uint256"],
        parsed.args.inputs[sample.refundCommandIndex]
      );
      expect(refundMinimum.toString()).toBe("0");
      expect(sample.expected.fromToken).not.toBe(sample.expected.toToken);
    }
  });
});

const verificationSamples = samples.filter((sample) => sample.quote);
const paramsFor = (sample: Fixture): VerifySdkParams => ({
  chain: sample.chain as CHAINS_ENUM,
  chainId: sample.tx.chainId,
  dexId: sample.dexId,
  slippage: sample.slippage ?? "1",
  data: { ...sample.quote!, tx: sample.tx },
  payTokenId: sample.quote!.fromToken,
  receiveTokenId: sample.quote!.toToken,
  nativeTokenAddress: sample.nativeTokenAddress,
  userAddress: sample.userAddress ?? sample.tx.from,
});
// Exercise recipient / failure behavior once for each DEX.
const sdkSamples = [DEX_ENUM.UNI, DEX_ENUM.MAGPIE].map(
  (dexId) => verificationSamples.find((sample) => sample.dexId === dexId)!
);

describe("SDK fee, precision and recipient verification", () => {
  it.each(
    verificationSamples.filter((sample) => sample.dexId === DEX_ENUM.MAGPIE)
  )("reads the Magpie payload and input fees once: $name", (sample) => {
    const payloadReads = jest.spyOn(Interface.prototype, "parseTransaction");
    const feeReads = jest.spyOn(magpieFees, "decodeDexAggregatorInputFee");
    try {
      expect(verifySdk(paramsFor(sample)).isSdkDataPass).toBe(true);
      expect(payloadReads).toHaveBeenCalledTimes(1);
      expect(feeReads).toHaveBeenCalledTimes(1);
    } finally {
      payloadReads.mockRestore();
      feeReads.mockRestore();
    }
  });

  it("[Magpie] does not reuse Magpie fees for different calldata", () => {
    const sample = sdkSamples[1];
    const other = verificationSamples.find(
      (item) =>
        item.dexId === DEX_ENUM.MAGPIE &&
        item.quote!.fromToken !== item.nativeTokenAddress
    )!;
    const params = paramsFor(sample);
    const decoded = verifySdk(params).decoded!;
    expect(
      verifyCalldata({
        dexId: DEX_ENUM.MAGPIE,
        tx: other.tx,
        data: params.data,
        decoded,
        slippage: String(Number(params.slippage) / 100),
      })
    ).toBe(false);
  });

  it.each(verificationSamples)("$name", (sample) => {
    const params = paramsFor(sample);
    const result = verifySdk(params);
    expect(result).toMatchObject({
      routerPass: true,
      spenderPass: true,
      callDataPass: true,
      receiverPass: true,
      isSdkDataPass: true,
    });
    expect(normalize(result.decoded!)).toEqual(sample.expected);
    const verification = {
      dexId: sample.dexId,
      tx: sample.tx,
      data: params.data,
      decoded: result.decoded!,
      slippage: String(Number(params.slippage) / 100),
    };
    expect(verifyCalldata(verification)).toBe(true);
    expect(verifyCalldata({ ...verification, decoded: null })).toBe(false);
    expect(
      verifyCalldata({
        ...verification,
        decoded: { ...result.decoded!, toToken: zero },
      })
    ).toBe(false);
    expect(
      verifyCalldata({
        ...verification,
        decoded: {
          ...result.decoded!,
          minReceiveToTokenAmount: new BigNumber(
            result.decoded!.minReceiveToTokenAmount
          )
            .idiv(2)
            .toFixed(0),
        },
      })
    ).toBe(false);
    expect(
      verifyCalldata({
        ...verification,
        decoded: {
          ...result.decoded!,
          fromTokenAmount: new BigNumber(result.decoded!.fromTokenAmount)
            .plus(1)
            .toFixed(0),
        },
      })
    ).toBe(false);
    expect(
      verifySdk({
        ...params,
        data: { ...params.data!, fromTokenAmount: "1" },
      }).callDataPass
    ).toBe(false);
  });

  it.each(sdkSamples)("rejects a foreign recipient: $name", (sample) => {
    expect(
      verifySdk({ ...paramsFor(sample), userAddress: otherUser })
    ).toMatchObject({
      callDataPass: true,
      receiverPass: false,
      isSdkDataPass: false,
    });
  });

  it.each(sdkSamples)("rejects undecodable calldata: $name", (sample) => {
    const params = paramsFor(sample);
    expect(
      verifySdk({
        ...params,
        data: { ...params.data!, tx: { ...sample.tx, data: "0xdeadbeef" } },
      })
    ).toMatchObject({
      routerPass: true,
      spenderPass: true,
      callDataPass: false,
      receiverPass: true,
      isSdkDataPass: false,
      decoded: null,
    });
  });

  it.each([
    { recipient: zero, allowed: true },
    { recipient: otherUser, allowed: false },
  ])(
    "[Magpie] checks the literal Magpie recipient $recipient",
    ({ recipient, allowed }) => {
      const params = paramsFor(sdkSamples[1]);
      const data = params.data!;
      // LibRouter.toAddress occupies absolute calldata bytes [72, 92).
      const start = 2 + 72 * 2;
      const calldata = data.tx.data;
      const result = verifySdk({
        ...params,
        data: {
          ...data,
          tx: {
            ...data.tx,
            data:
              calldata.slice(0, start) +
              recipient.slice(2) +
              calldata.slice(start + 40),
          },
        },
      });
      expect(result.decoded?.toTokenReceiver).toBe(recipient);
      expect(result.callDataPass).toBe(true);
      expect(result.receiverPass).toBe(allowed);
      expect(result.isSdkDataPass).toBe(allowed);
    }
  );
});
