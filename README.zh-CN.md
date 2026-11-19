# rabby-swap

[English](./README.md) | 简体中文

## 配置维护

定期核对以下配置；出现新池、新币或合约升级时按需更新：

- [合约白名单](./src/list.ts)：重点核对 router/spender 地址。
- [1inch 配置](./src/calldata/oneinch/config.ts)：工厂、候选币和 Curve 池。
- [0x 配置](./src/dexs/0xapi_v2.config.ts)：池币种和包装币映射。
- [币种分类](./src/tokenPools.ts)：稳定币及原生币衍生币名单。

更新前核对官方资料和链上数据，更新后运行相关测试。
配置不会自动刷新，需要发布 SDK 并更新使用方依赖才生效。
价格或 TVL 变化本身不需要更新。

## 测试

```sh
yarn test:swap-calldata                 # 所有 DEX
yarn test:swap-calldata:1inch            # 仅 1inch
yarn test:swap-calldata:0x               # 仅 0x
```

其他 DEX 后缀：`uni`、`magpie`、`pancake`、`sushi`、`openocean`、`kyberswap`。
测试离线运行，不发送交易。

参见[回归样本与核对依据](./__tests__/fixtures/swap-calldata/swap-parser-regressions.json)和[采集报价说明](./__tests__/fixtures/swap-calldata/other-dex/README.md)。
