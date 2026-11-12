import { CHAINS_ENUM } from "@debank/common";
import { Interface } from "@ethersproject/abi";
import type { OpenApiService } from "@rabby-wallet/rabby-api";
import {
  DEX_ENUM,
  DEX_SUPPORT_CHAINS,
  WrapTokenAddressMap,
  getQuote,
  getRouter,
  getSpender,
  verifySdk,
} from "../src";
import { getChainByEnum, getChainById, getChainByServerId } from "../src/chain";
import { OpenOceanABI, ZeroXABIV2 } from "../src/abi";
import { NULL_ADDRESS } from "../src/utils";

const ELYSIUM = "ELYSIUM" as CHAINS_ENUM;
const NATIVE = "elysium";
const WHYPE = "0xba876237b0f021a6c6d852d6c26e107997cc5e81";
const USDC = "0xb47c4c8f73f009cc0c0d3f92b388d13e293f0b65";
const USER = "0x1111111111111111111111111111111111111111";
const SETTLER = "0x2222222222222222222222222222222222222222";
const EEEE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const zeroX = new Interface(ZeroXABIV2);
const openOcean = new Interface(OpenOceanABI);

it("resolves Elysium through every chain lookup", () => {
  const expected = {
    enum: ELYSIUM,
    id: 99901,
    serverId: NATIVE,
    nativeTokenAddress: NATIVE,
  };
  expect(getChainById(99901)).toEqual(expected);
  expect(getChainByEnum(ELYSIUM)).toEqual(expected);
  expect(getChainByServerId(NATIVE)).toEqual(expected);
});

it("exposes the enabled Elysium aggregators and native wrapping", () => {
  expect(
    Object.entries(DEX_SUPPORT_CHAINS)
      .filter(([, chains]) => chains.includes(ELYSIUM))
      .map(([dex]) => dex)
      .sort()
  ).toEqual([DEX_ENUM.ZEROXAPIV2, DEX_ENUM.OPENOCEAN, DEX_ENUM.WRAPTOKEN].sort());
  expect(WrapTokenAddressMap[ELYSIUM]).toBe(WHYPE);
});

describe.each([
  {
    dexId: DEX_ENUM.ZEROXAPIV2,
    backendId: "elysium_matcha_v2",
    router: "0x0000000000001fF3684f28c67538d4D072C22734",
  },
  {
    dexId: DEX_ENUM.OPENOCEAN,
    backendId: "elysium_openocean",
    router: "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
  },
])("Elysium $dexId", ({ dexId, backendId, router }) => {
  it("uses the configured router and spender", () => {
    expect(getRouter(dexId, ELYSIUM, USDC, NATIVE)).toBe(router);
    expect(getSpender(dexId, ELYSIUM)).toBe(router);
  });

  it.each([
    { fromToken: NATIVE, toToken: USDC },
    { fromToken: USDC, toToken: NATIVE },
    { fromToken: WHYPE, toToken: USDC },
  ])("quotes and verifies $fromToken -> $toToken", async ({ fromToken, toToken }) => {
    const input = fromToken === NATIVE ? NULL_ADDRESS : fromToken;
    const nativeOutput = dexId === DEX_ENUM.ZEROXAPIV2 ? EEEE : NULL_ADDRESS;
    const output = toToken === NATIVE
      ? nativeOutput
      : toToken;
    // Synthetic payloads cover SDK wiring independently of live route availability.
    const data = dexId === DEX_ENUM.ZEROXAPIV2
      ? zeroX.encodeFunctionData("exec", [
          SETTLER,
          input,
          "1000",
          SETTLER,
          zeroX.encodeFunctionData("execute", [
            [USER, output, "990"],
            [],
            `0x${"00".repeat(32)}`,
          ]),
        ])
      : openOcean.encodeFunctionData("swap", [
          USER,
          {
            srcToken: input,
            dstToken: output,
            srcReceiver: USER,
            dstReceiver: USER,
            amount: "1000",
            minReturnAmount: "990",
            guaranteedAmount: "1000",
            flags: 0,
            referrer: NULL_ADDRESS,
            permit: "0x",
          },
          [],
        ]);
    const decimals = fromToken === USDC ? 6 : 18;
    const api = {
      getSwapQuote: jest.fn().mockResolvedValue({
        pay_token: { id: fromToken, decimals },
        receive_token: { id: toToken, decimals: toToken === USDC ? 6 : 18 },
        receive_token_raw_amount: "1000",
        dex_swap_to: router,
        dex_swap_calldata: data,
      }),
    };
    const quote = await getQuote(
      dexId,
      {
        chain: ELYSIUM,
        chainServerId: "",
        nativeTokenAddress: "",
        fromToken,
        toToken,
        fromTokenDecimals: decimals,
        amount: "1000",
        userAddress: USER,
        slippage: 1,
        insufficient: false,
      },
      api as unknown as OpenApiService
    );

    expect(api.getSwapQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        chain_id: NATIVE,
        dex_id: backendId,
        pay_token_id: fromToken,
        receive_token_id: toToken,
        slippage: 0.01,
      })
    );
    expect(quote.tx.value).toBe(fromToken === NATIVE ? "1000" : "0");
    const result = verifySdk({
      chain: ELYSIUM,
      chainId: 99901,
      dexId,
      slippage: 1,
      data: quote,
      payTokenId: fromToken,
      receiveTokenId: toToken,
      nativeTokenAddress: NATIVE,
      userAddress: USER,
    });
    expect(result.isSdkDataPass).toBe(true);
    expect(result.decoded?.fromToken.toLowerCase()).toBe(fromToken);
    expect(result.decoded?.toToken.toLowerCase()).toBe(toToken);
    expect(result.decoded).toMatchObject({
      fromTokenAmount: "1000",
      minReceiveToTokenAmount: "990",
    });
  });
});

it.each([
  { fromToken: NATIVE, toToken: WHYPE, selector: "0xd0e30db0", value: "1000" },
  { fromToken: WHYPE, toToken: NATIVE, selector: "0x2e1a7d4d", value: "0" },
])("constructs HYPE/WHYPE wrapping from $fromToken", async ({ fromToken, toToken, selector, value }) => {
  const quote = await getQuote(
    DEX_ENUM.WRAPTOKEN,
    {
      chain: ELYSIUM,
      chainServerId: "",
      nativeTokenAddress: "",
      fromToken,
      toToken,
      fromTokenDecimals: 18,
      amount: "1000",
      userAddress: USER,
      slippage: 1,
      insufficient: false,
    },
    {} as OpenApiService
  );
  expect(quote.tx.to).toBe(WHYPE);
  expect(quote.tx.value).toBe(value);
  expect(quote.tx.data.slice(0, 10)).toBe(selector);
});
