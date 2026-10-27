# October 26 regression quotes

`oct26-regressions.json` retains all 18 failing records from
`swap-calldata-results-2026-10-26T14-45-01-420Z.json`, including complete raw quotes,
requests, historical SDK flags and transaction data. Original records are not edited.

- `valid`: four 1inch `unoswap` quotes and two 0x Settler terminal-action quotes.
  Fixed expectations are independent of the production decoder. The 1inch pools
  were matched using the official V3 SDK CREATE2 derivation (fee 100): Ethereum
  USDC/USDT `0x3416cF6C708Da44DB2624D63ea0AAef7113527C6`, Arbitrum USDC/USDC.e
  `0x8e295789c9465487074a65b1ae9Ce0351172393f`. Output direction follows V6's bit 247.
  0x output, minimum and recipient come from the original terminal UNISWAPV3 action.
- `invalidTempo`: twelve requests involving the virtual `tempo` native alias.
  They must continue to fail SDK verification. The test generator now uses real
  pathUSD token metadata; it must not relabel these old 18-decimal amounts as
  6-decimal TIP-20 amounts or weaken SDK matching.

The total command and DEX-specific commands include `dexCalldataRegression.test.ts`.
Negative cases cover mismatched pool assets/direction, unsupported pools/protocols,
native value/unwrap, missing sender, missing output constraints, malformed paths,
unknown terminal actions and the actual terminal recipient.

`unoswap` remains synchronous: it currently resolves SDK-known assets on canonical
V3 factories on Ethereum, Optimism, Polygon and Arbitrum, with standard fee tiers.
Other factories/assets/protocols and native-unwrap variants remain unsupported.
The 0x zero-slippage branch supports only the verified terminal UNISWAPV3 format;
unknown terminal actions continue to fail closed.
