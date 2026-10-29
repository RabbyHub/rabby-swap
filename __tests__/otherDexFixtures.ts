import { readFileSync } from "fs";
import { join } from "path";
import { gunzipSync } from "zlib";
import type { CHAINS_ENUM } from "@debank/common";
import type { DEX_ENUM, DecodeCalldataResult, VerifySdkParams } from "../src";
import type { QuoteResult } from "../src/quote";

type RecordedSample = {
  name: string;
  expected: DecodeCalldataResult;
  record: {
    id: number;
    dex: DEX_ENUM;
    chain: CHAINS_ENUM;
    chainId: number;
    slippage: string;
    quote: QuoteResult;
    request: {
      fromToken: string;
      toToken: string;
      fromTokenAmount: string;
      nativeTokenAddress: string;
      userAddress: string;
    };
  };
};

// Keep original quotes (including origin) without checking 45 MB of JSON into Git.
// Reading these fixtures is offline and does not depend on the Downloads export.
export const otherDexSamples: RecordedSample[] = [
  "0xapi-v2",
  "1inch",
  "kyberswap",
  "openocean",
  "sushi",
].flatMap((dex) => {
  const data = gunzipSync(
    readFileSync(join(__dirname, "fixtures/swap-calldata/other-dex", `${dex}.json.gz`))
  );
  return (JSON.parse(data.toString("utf8")) as { samples: RecordedSample[] }).samples.map(
    (sample) => ({ ...sample, name: `[${sample.record.dex}] ${sample.name}` })
  );
});

export const otherDexParamsFor = (sample: RecordedSample): VerifySdkParams => {
  const { record } = sample;
  const { request } = record;
  return {
    dexId: record.dex,
    chain: record.chain,
    chainId: record.chainId,
    slippage: record.slippage,
    nativeTokenAddress: request.nativeTokenAddress,
    userAddress: request.userAddress,
    payTokenId: request.fromToken,
    receiveTokenId: request.toToken,
    // Expectations come from the original request, not the quote's own claims.
    data: {
      ...record.quote,
      fromToken: request.fromToken,
      toToken: request.toToken,
      fromTokenAmount: request.fromTokenAmount,
    },
  };
};
