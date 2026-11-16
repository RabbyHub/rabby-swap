# rabby-swap

English | [简体中文](./README.zh-CN.md)

## Configuration maintenance

Periodically review these configurations; update as needed for new pools, tokens or contract upgrades:

- [Contract allowlists](./src/list.ts): review router/spender addresses.
- [1inch configuration](./src/calldata/oneinch/config.ts): factories, candidate tokens and Curve pools.
- [0x configuration](./src/dexs/0xapi_v2.config.ts): pool tokens and wrapped-token mappings.
- [Token classification](./src/tokenPools.ts): stablecoin and native/derivative token lists.

Verify changes against official sources and on-chain data, then run the affected tests.
Configuration does not refresh automatically: publish the SDK and update consumers to apply changes.
Price or TVL changes alone do not require updates.

## Tests

```sh
yarn test:swap-calldata                 # All DEXes
yarn test:swap-calldata:1inch            # 1inch only
yarn test:swap-calldata:0x               # 0x only
```

Other DEX suffixes: `uni`, `magpie`, `pancake`, `sushi`, `openocean`, `kyberswap`.
Tests run offline and do not send transactions.

See [regression samples and evidence](./__tests__/fixtures/swap-calldata/swap-parser-regressions.json)
and [recorded-quote details](./__tests__/fixtures/swap-calldata/other-dex/README.md).
