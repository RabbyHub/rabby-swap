import { DEX_ENUM } from "../src/consts";
import { decodeCalldata } from "../src/quote";
import fixtures from "./fixtures/swap-calldata/onchain-decode.json";

describe("On-chain calldata decoding", () => {
  describe("Supported routes", () => {
    it.each(fixtures.supported)("$name / $transactionHash", (sample) => {
      const decoded = decodeCalldata(sample.dexId as DEX_ENUM, sample.tx);
      expect(decoded).not.toBeNull();
      expect(
        Object.fromEntries(
          Object.entries(decoded!).map(([key, value]) => [
            key,
            value.toLowerCase(),
          ])
        )
      ).toEqual(sample.expected);
    });
  });

  describe("Unsupported routes", () => {
    it.each(fixtures.unsupported)(
      "$name / $transactionHash returns null ($reason)",
      (sample) => {
        expect(decodeCalldata(sample.dexId as DEX_ENUM, sample.tx)).toBeNull();
      }
    );
  });
});
