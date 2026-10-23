# Recorded quotes for other DEX decoders

Source: `swap-calldata-results-2026-10-22T16-10-39-058Z.json`, SDK `0.0.89-alpha.1`.
All 3,093 records outside Uniswap, Magpie and PancakeSwap are included, including retries:

- 0xAPIV2: 524; `0x2213bc0b` AllowanceHolder `exec`, inner `0x1fff991f` Settler `execute`.
- 1inch: 456; `0x07ed2379` V6 `swap`.
- Kyberswap: 576; `0xe21fd0e9` `swap`.
- OpenOcean: 746; `0x90411a32` `swap`, `0x0a9704d5` `simpleSwap`.
- Sushi: 791; `0x5f3bd1c8` `snwap`, `0xd33721a5` `snwapMultiple`.

Each `.json.gz` contains source metadata (including the export SHA-256) and samples.
Every sample contains the **complete unmodified export record** under `record`, including
the quote, raw backend `origin`, calldata, request and historical verification results.
Compression avoids duplicating ~45 MB of raw data in source text; no network is required.

`expected` contains five fixed decoded fields, extracted by the independent ABI
definitions in `import.cjs`. It does not call a production decoder or import `src/abi.ts`.
The previous SDK result is provenance only, never the assertion's source of truth.

Oracle details:

- 0x: input token/amount from AllowanceHolder; output token/minimum/recipient from Settler.
- Sushi multiple: assert one input asset and one output asset, then sum **all** input amounts.
- Native markers are normalized using the export's native-token identity, without relying on `CHAINS`.
- CELO's `0x471e...` ERC-20 identity stays an address. The two OpenOcean failures must not
  become successful expectations by copying the old decoder's `celo` output.
- The 12 Arc/1inch records retain the exact encoded amount and the original requested
  amount separately. The native 18-decimal request contains sub-6-decimal dust absent
  from calldata; verification still needs to account for this difference.

The existing `__tests__/swapCalldataFixtures.test.ts` runs two groups:

1. Require actual decoding and exact equality of all five decoded fields.
2. Require actual decoding plus `callDataPass` and `receiverPass` for the original request.

These are ordinary tests, **not** `it.failing`, skipped cases or snapshots of `null`.
Unsupported inputs and incorrect fields should turn the suite red until fixed.
Historical pass/failure labels in test names describe the old export, not current behavior.
Some old failures depend on the application's chain catalogue; this SDK suite uses its
own installed `@debank/common`, so current counts may differ from the old export.
Router/spender whitelist checks are intentionally outside these calldata assertions.

Run everything with the existing command:

```sh
yarn test:swap-calldata
```

Run just these fixtures, or one DEX/record:

```sh
yarn test:swap-calldata -t 'Recorded other DEX calldata'
yarn test:swap-calldata:sushi
yarn test:swap-calldata:openocean
yarn test:swap-calldata:kyberswap
yarn test:swap-calldata:1inch
yarn test:swap-calldata:0x
yarn test:swap-calldata -t 'Recorded other DEX calldata.*#2679 '
```

Inspect one compressed fixture as ordinary JSON:

```sh
node -e 'console.log(require("zlib").gunzipSync(require("fs").readFileSync("__tests__/fixtures/swap-calldata/other-dex/openocean.json.gz")).toString())'
```

To intentionally regenerate all five files from another complete export:

```sh
node __tests__/fixtures/swap-calldata/other-dex/import.cjs /path/to/swap-calldata-results.json
```

Reference interfaces for the nested 0x payload:
[IAllowanceHolder](https://github.com/0xProject/0x-settler/blob/master/src/allowanceholder/IAllowanceHolder.sol),
[ISettlerTakerSubmitted](https://github.com/0xProject/0x-settler/blob/master/src/interfaces/ISettlerTakerSubmitted.sol).
