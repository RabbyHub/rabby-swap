# Calldata tests

Run every DEX's calldata tests (unit cases and recorded quotes):

```sh
yarn test:swap-calldata
```

Run a single DEX:

```sh
yarn test:swap-calldata:uni
yarn test:swap-calldata:magpie
yarn test:swap-calldata:pancake
yarn test:swap-calldata:sushi
yarn test:swap-calldata:openocean
yarn test:swap-calldata:kyberswap
yarn test:swap-calldata:1inch
yarn test:swap-calldata:0x
```

DEX-specific commands match the exact `[DEX]` test label, including parameterized
fixture names. Uni and Magpie also include their router, fee, precision and recipient
unit cases; PancakeSwap includes its real quotes and `swapExactIn` unit cases.
The other five DEXes use the complete recorded-quote dataset.

To investigate a single record or test, use Jest's name filter on the total command:

```sh
yarn test:swap-calldata -t '\[OpenOcean\].*#2679 '
yarn test:swap-calldata -t '\[Uniswap\].*Arc native precision'
```

Unsupported decoders and incorrect results intentionally fail these tests. A null
decode is never treated as a passing fixture, even if SDK verification skips it.
These commands run offline; no quote API calls or onchain transactions are made.

See [recorded-quote details](./__tests__/fixtures/swap-calldata/other-dex/README.md)
for dataset provenance and independent expected fields.
