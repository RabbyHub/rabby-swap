import { Interface } from "@ethersproject/abi";
import { CHAINS_ENUM } from "@debank/common";
import BigNumber from "bignumber.js";
import { PancakeSwapABI } from "../src/abi";
import { DEX_ENUM } from "../src/consts";
import { decodeCalldata, QuoteResult, TxWithChainId } from "../src/quote";
import { decodeSwapCalldata, verifySdk } from "../src";
import { NULL_ADDRESS } from "../src/utils";

type Fixture = {
  name: string;
  chainId: number;
  fromTokenAmount: string;
  minReceiveToTokenAmount: string;
  quote: {
    pay_token: { id: string; chain: string; decimals: number };
    receive_token: { id: string; chain: string; decimals: number };
    receive_token_raw_amount: number;
    dex_approve_to: string;
    dex_swap_to: string;
    dex_swap_calldata: string;
  };
};

// The five original quote responses are kept intact, including their calldata.
const fixtures: Fixture[] = require("./fixtures/pancake-quotes.json");
const USER = "0x341a1fbd51825e5a107db54ccb3166deba145479";
const OTHER = "0x2222222222222222222222222222222222222222";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const contractInterface = new Interface(PancakeSwapABI);

const toTx = (fixture: Fixture): TxWithChainId => ({
  from: USER,
  to: fixture.quote.dex_swap_to,
  data: fixture.quote.dex_swap_calldata,
  value: "0",
  chainId: fixture.chainId,
});

const toQuote = (fixture: Fixture): QuoteResult => ({
  tx: toTx(fixture),
  fromToken: fixture.quote.pay_token.id,
  fromTokenAmount: fixture.fromTokenAmount,
  fromTokenDecimals: fixture.quote.pay_token.decimals,
  toToken: fixture.quote.receive_token.id,
  toTokenAmount: String(fixture.quote.receive_token_raw_amount),
  toTokenDecimals: fixture.quote.receive_token.decimals,
  spender: fixture.quote.dex_approve_to,
});

const sdkParams = (fixture: Fixture) => ({
  chain: fixture.quote.pay_token.chain.toUpperCase() as CHAINS_ENUM,
  dexId: DEX_ENUM.PANCAKESWAP,
  slippage: 1,
  data: toQuote(fixture),
  payTokenId: fixture.quote.pay_token.id,
  receiveTokenId: fixture.quote.receive_token.id,
  nativeTokenAddress: fixture.quote.pay_token.chain,
  chainId: fixture.chainId,
  userAddress: USER,
});

describe("PancakeSwap real quote fixtures", () => {
  it.each(fixtures)("decodes every field of $name", (fixture) => {
    const decoded = decodeCalldata(DEX_ENUM.PANCAKESWAP, toTx(fixture));

    expect(decoded).not.toBeNull();
    expect({
      ...decoded,
      fromToken: decoded!.fromToken.toLowerCase(),
      toTokenReceiver: decoded!.toTokenReceiver.toLowerCase(),
    }).toEqual({
      fromToken: fixture.quote.pay_token.id,
      fromTokenAmount: fixture.fromTokenAmount,
      toToken: fixture.quote.receive_token.id,
      minReceiveToTokenAmount: fixture.minReceiveToTokenAmount,
      toTokenReceiver: USER,
    });
    // Each captured request uses 1% slippage on the post-fee quote amount.
    expect(decoded!.minReceiveToTokenAmount).toBe(
      new BigNumber(fixture.quote.receive_token_raw_amount)
        .times("0.99")
        .integerValue(BigNumber.ROUND_CEIL)
        .toFixed(0)
    );
  });

  it.each(fixtures)("passes SDK verification for $name", (fixture) => {
    const result = verifySdk(sdkParams(fixture));

    expect(result.decoded).not.toBeNull();
    expect(result.routerPass).toBe(true);
    expect(result.spenderPass).toBe(true);
    expect(result.callDataPass).toBe(true);
    expect(result.receiverPass).toBe(true);
    expect(result.isSdkDataPass).toBe(true);
  });

  it.each([
    { name: "input token", mismatch: { fromToken: OTHER } },
    { name: "output token", mismatch: { toToken: OTHER } },
    { name: "input amount", mismatch: { fromTokenAmount: "999999" } },
    { name: "output amount", mismatch: { toTokenAmount: "1000" } },
  ])("rejects a mismatched $name", ({ mismatch }) => {
    const params = sdkParams(fixtures[0]);
    const result = verifySdk({
      ...params,
      data: { ...params.data, ...mismatch },
    });

    expect(result.decoded).not.toBeNull();
    expect(result.callDataPass).toBe(false);
    expect(result.isSdkDataPass).toBe(false);
  });

  it("rejects a quote whose encoded recipient is another account", () => {
    const result = verifySdk({ ...sdkParams(fixtures[0]), userAddress: OTHER });

    expect(result.callDataPass).toBe(true);
    expect(result.receiverPass).toBe(false);
    expect(result.isSdkDataPass).toBe(false);
  });
});

const encodeSwap = ({
  inputToken = USDC,
  outputToken = NULL_ADDRESS,
  amounts = ["1000000"],
  recipient = USER,
  feeConfig = "0",
}: {
  inputToken?: string;
  outputToken?: string;
  amounts?: string[];
  recipient?: string;
  feeConfig?: string;
} = {}): TxWithChainId => ({
  ...toTx(fixtures[3]),
  data: contractInterface.encodeFunctionData("swapExactIn", [
    0,
    [inputToken, outputToken, "900", "2000000000"],
    amounts,
    amounts.map(() => [
      {
        mixAdapters: [0],
        assetTo: [USER],
        rawData: [0],
        extraData: ["0x"],
        fromToken: inputToken,
      },
    ]),
    feeConfig,
    recipient,
  ]),
});

describe("PancakeSwap swapExactIn semantics", () => {
  it("sums split-route inputs without losing integer precision", () => {
    const decoded = decodeCalldata(
      DEX_ENUM.PANCAKESWAP,
      encodeSwap({ amounts: ["9007199254740993", "9007199254740995"] })
    );

    expect(decoded!.fromTokenAmount).toBe("18014398509481988");
  });

  it("normalizes zero-address native input and preserves ERC20 output", () => {
    const tx = encodeSwap({
      inputToken: NULL_ADDRESS,
      outputToken: USDC,
      amounts: ["1000000000000000"],
    });
    const decoded = decodeCalldata(DEX_ENUM.PANCAKESWAP, {
      ...tx,
      value: "1000000000000000",
    });

    expect(decoded!.fromToken).toBe("eth");
    expect(decoded!.fromTokenAmount).toBe("1000000000000000");
    expect(decoded!.toToken).toBe(USDC);
  });

  it("preserves wrapped ETH as an ERC20 token", () => {
    const decoded = decodeCalldata(
      DEX_ENUM.PANCAKESWAP,
      encodeSwap({ outputToken: WETH })
    );

    expect(decoded!.toToken).toBe(WETH);
  });

  it("resolves a zero-address recipient to msg.sender", () => {
    const decoded = decodeCalldata(
      DEX_ENUM.PANCAKESWAP,
      encodeSwap({ recipient: NULL_ADDRESS })
    );

    expect(decoded!.toTokenReceiver).toBe(USER);
  });

  it("preserves an explicit recipient instead of replacing it with msg.sender", () => {
    const decoded = decodeCalldata(
      DEX_ENUM.PANCAKESWAP,
      encodeSwap({ recipient: OTHER })
    );

    expect(decoded!.toTokenReceiver).toBe(OTHER);
  });

  it("uses the enforced minimum rather than feeConfig's gross quote amount", () => {
    // 25 bps, partner 1, quoted gross output 1000; minOutputAmount remains 900.
    const feeConfig = new BigNumber(2)
      .pow(240)
      .times(25)
      .plus(new BigNumber(2).pow(224))
      .plus(1000)
      .toFixed(0);
    const decoded = decodeCalldata(
      DEX_ENUM.PANCAKESWAP,
      encodeSwap({ feeConfig })
    );

    expect(decoded!.fromTokenAmount).toBe("1000000");
    expect(decoded!.minReceiveToTokenAmount).toBe("900");
  });

  it.each(["0xdeadbeef", "0xedad400c"])(
    "does not produce decoded fields for unsupported or malformed data %s",
    (data) => {
      expect(
        decodeSwapCalldata(DEX_ENUM.PANCAKESWAP, {
          ...toTx(fixtures[0]),
          data,
        })
      ).toBeNull();
    }
  );
});
