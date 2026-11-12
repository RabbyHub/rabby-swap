# 1inch unoswap 扩展：官方资料与链上复核

核对日期：2026-11-10。范围为本地新增的 BSC/Base 部署配置、BSC Pancake V1/V2、ETH crvUSD/USDT Curve 池，以及相关解析测试。解析器仍同步运行，不在生产解析时请求 RPC。

## 证据与可复核数据

[原始查询与结果](./oneinch-deployment-check.json)记录了固定区块、区块哈希、调用地址、calldata、RPC 返回值、解码值，以及源码匹配状态与 SHA-256。共 39 项 RPC 查询、7 个源码来源；RPC 为公开 PublicNode 服务，属于独立链上观察，并非官方报价服务。

- Ethereum：区块 `26381676`，9 项查询。
- BSC：区块 `132700577`，20 项查询。
- Base：区块 `55446068`，10 项查询。

复核时对每个返回值与预期部署信息做了断言。复现 `eth_call` 时，用 JSON 内的 `to`、`data` 和对应链的 `blockTag`；复现 `eth_getCode` 时，用 `address` 与 `blockTag`，对结果计算 Keccak-256。源码 URL 中的 main/master 会变化，记录的 SHA-256 标识本次读取版本。

## 官方文档与部署源码

### 1inch

- [Classic Swap 官方文档](https://business.1inch.com/portal/documentation/apis/swap/classic-swap/introduction)：确认 API 的多链、多流动性来源背景；不能仅凭 API 支持某链推断本 SDK 已覆盖该链全部 calldata。
- 部署 Router：`0x111111125421ca6dc452d289314280a0f8842a65`。
- Sourcify 验证源码：[Ethereum](https://sourcify.dev/server/v2/contract/1/0x111111125421ca6dc452d289314280a0f8842a65?fields=abi,sources)、[BSC](https://sourcify.dev/server/v2/contract/56/0x111111125421ca6dc452d289314280a0f8842a65?fields=abi,sources)、[Base](https://sourcify.dev/server/v2/contract/8453/0x111111125421ca6dc452d289314280a0f8842a65?fields=abi,sources)。三个部署的创建代码、运行时代码均返回 `exact_match`。这是部署合约的验证来源，不是 1inch 官方文档站点。

核对 `ProtocolLib`、`_unoswap`、`_unoswapTo2/3`、`_curfe` 与 ABI：

- 五个入口 selector 分别为 `83800a8e / 8770ba91 / 19367472 / a76dfc3b / 89af926a`，本轮没有新增入口。
- `dex >> 253`：0=V2，1=V3，2=Curve。V2/V3 的方向位为 247；Curve 的这个位含义不同，不能复用。
- 三个 Router 的 `_FF_FACTORY` 分别对应本地 ETH/BSC/Base 的 V3 factory，`_POOL_INIT_CODE_HASH` 与本地一致。
- Curve 的 swap selector 索引位于 184；输入/输出币种 getter 偏移位于 192/208；getter 参数位于 200/216；实际兑换索引位于 224/232。
- getter 偏移 8 对应 `coins(uint256)`（`0xc6610657`）；swap 索引 0/2 分别对应四参数 exchange（`0x3df02124`）和带 receiver 的重载（`0xddc1f59d`）。后者必须匹配 bit 244。
- bits 240..249 涉及原生币处理、附加参数、返回值或回调；当前 Curve 分支仅接受普通 ERC20 调用及匹配的 receiver 标志。
- 多跳使用上一跳产出继续兑换，最终最低接收量来自外层 `minReturn`；支持的入口最终接收人是 `tx.from`。

### Uniswap

- 官方部署文档：[BNB](https://developers.uniswap.org/docs/protocols/v3/deployments/v3-bnb-deployments)、[Base](https://developers.uniswap.org/docs/protocols/v3/deployments/v3-base-deployments)。
- 官方 SDK：[部署地址](https://github.com/Uniswap/sdks/blob/main/sdks/sdk-core/src/addresses.ts)、[V3 部署哈希](https://github.com/Uniswap/sdks/blob/main/sdks/v3-sdk/src/constants.ts)、[CREATE2 推导](https://github.com/Uniswap/sdks/blob/main/sdks/v3-sdk/src/utils/computePoolAddress.ts)。
- BSC V3 factory：`0xdb1d10011ad0ff90774d0c6bb92e5c5c8b4461f7`。
- Base V3 factory：`0x33128a8fc17869897dce68ed026d694621f6fdfd`。
- BSC/Base V2 factory：`0x8909dc15e40173ff4699343b6eb8132c65e18ec6`。

逐池交叉核对 factory 的 `getPair/getPool` 与池的 `factory/token0/token1`；V3 还核对 `fee`。包含原有六个 BSC/Base 测试池，以及新混合路径测试使用的 ETH USDT/WETH V3 池 `0x4e68ccd3e89f51c3074ca5072bbac773960dfa36`（fee=3000）。地址结果详见 JSON。

### PancakeSwap

- [官方查询池说明](https://docs.pancakeswap.finance/trade/trading-faq/swap-faq)、[官方 V2 SDK 常量](https://github.com/pancakeswap/pancake-swap-sdk/blob/master/src/constants.ts)。
- BSC V1 factory：`0xbcfccbde45ce874adcb698cc183debcf17952812`。
- BSC V2 factory：`0xca143ce32fe78f1f7019d7d551a6402fc5350c73`。
- 两个 factory 的 `INIT_CODE_PAIR_HASH()` 分别返回本地配置的 `0xd0d4…ece66` 和 `0x00fb…69bd5`；同时通过 `getPair` 及池的反向查询核对。

V1 的部署哈希依据本次直接链上读取，而不是把官方 V2 SDK 中的 testnet 常量当成 V1 主网依据。当前官方 V2 文档不能替代历史 V1 部署证明。

### Curve

- [官方 Plain Pools 文档](https://docs.curve.finance/developer/amm/legacy/stableswap/pools/plain-pools/)说明 `coins` 与 `exchange` 的币种索引关系。
- [官方池页面](https://www.curve.finance/dex/ethereum/pools/0x390f3595bCa2Df7d23783dFd126427CCeb997BF4)对应 ETH crvUSD/USDT 池。
- [具体实现验证源码](https://sourcify.dev/server/v2/contract/1/0x67fe41A94e779CcFa22cff02cc2957DC9C0e4286?fields=abi,sources)返回 `match`，不是 `exact_match`；按返回状态原样记录。
- 池 `0x390f3595bca2df7d23783dfd126427cceb997bf4` 的链上 runtime 是固定实现地址的最小代理，完整 45 字节代码保存在 JSON。
- `coins(0)=USDT`、`coins(1)=crvUSD`。实现源码的初始化检查 `factory == empty(address)`，币种在初始化时写入。
- 具体实现 ABI 确认四参数及五参数 exchange 重载。没有假设所有 Curve 池都实现相同接口。

## 测试分类与新增覆盖

- 用户提供的两条完整报价保留原始 calldata；没有交易哈希，不能称为已上链交易；发送人使用明确的测试占位地址。
- `oneinchUnoswapDecode.test.ts` 与 `oneinchCurveDecode.test.ts` 的其他路径是基于真实池构造的 ABI 输入，用于测试解析边界，不证明交易一定执行成功。
- `onchain-decode.json` 保留原有 16 条历史链上样本（12 条成功解析、4 条预期 null）。本轮没有把不支持的 Curve 历史样本改成通过。
- 所有新增测试只调用解析入口，不调用 router/spender/receiver 报价验证器。

本轮增加 17 项测试：Curve→V3（含末跳解包）、原生币→V3→Curve、三跳 Curve/V3、后续跳未知池/输入不连续/方向错误、Curve 输入索引越界；BSC 三个不同 factory 的三跳、Base 原生币两跳、后续池失败，以及未支持的协议编号。

## 执行与结果

独立解析测试命令（也重放已有 0x 链上解析样本）：

```sh
npm run test:swap-calldata:1inch-decode
```

该命令已实际执行：3 个测试集、78 项全部通过；这 78 项包含在下述 112 项内，不重复计数。

新增两份测试也纳入 `test:swap-calldata`，现有 `test:swap-calldata:1inch` 的名称过滤可运行它们。

2026-11-10 使用 Node 22.8.0、Jest/ts-jest 执行以下四份测试，共 **112 项全部通过**：

- `oneinchUnoswapDecode.test.ts`：26 项。
- `oneinchCurveDecode.test.ts`：36 项。
- `onchainCalldataDecode.test.ts`：16 项。
- `dexCalldataRegression.test.ts`：34 项既有回归，其中包含验证器测试；不属于新增的独立解析测试。

`git diff --check` 通过。未跑全量构建、全量 TS/ESLint/循环依赖检查，未发送交易，也未证明用户报价 `is_success: false` 的原因。

## 当前支持边界

V2/V3 仍依赖已配置 factory 与候选输出币种；V3 费率范围没有扩展。Curve 只覆盖上述一个已验证池的普通 ERC20 exchange，其他池、underlying、native 和 callback 变体仍返回 null。外层信任验证和最低接收量比较规则本轮均未修改。
