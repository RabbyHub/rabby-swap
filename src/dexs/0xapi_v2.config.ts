/**
 * 0x 离线配置：定期核对、手动更新，随 SDK 发布生效。
 * 核对依据：__tests__/fixtures/swap-calldata/swap-parser-regressions.json 的 evidence.blocked。
 */

// V2：链 ID → 池地址 → [token0, token1]，按链上顺序排列。
export const ZEROX_V2_POOLS: Record<
  number,
  Record<string, readonly [string, string]>
> = {
  56: {
    "0x66368157821458adf6875ceba349cfa2b5e69ffc": [
      "0x21caef8a43163eea865baee23b9c2e327696a3bf",
      "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
    ],
  },
};

// Few 路由及「包装币 → 底层币」映射，新增时确认 1:1 解包。
export const FEW_ROUTER_CONFIG: {
  chainId: number;
  address: string;
  tokens: Record<string, string>;
} = {
  chainId: 1,
  address: "0x39d1d8fcc5e6eeaf567bce4e29b94fec956d3519",
  tokens: {
    "0xa250cc729bb3323e7933022a67b52200fe354767":
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    "0xc4ae7165b8923558528b1067cb4bed45dc249bf6":
      "0xcabd955322dfbf94c084929ac5e9eca3feb5556f",
    "0x8e07d2ffa9bcffefec05d7268d07bacd16c5aa67":
      "0x2d1f7226bd1f780af6b9a49dcc0ae00e8df4bdee",
  },
};
