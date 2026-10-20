import BigNumber from "bignumber.js";
import { PackedReader, PackedSwap } from "./packed";

// DexAggregator LibRouter.getData(), verified Arbitrum source:
// https://sourcify.dev/server/v2/contract/42161/0x20F6ee51340aDEed01A59B0e65cB3703f3dc860c?fields=sources
export const decodeDexAggregator = (data: PackedReader): PackedSwap => ({
  receiver: data.address(72),
  fromAsset: data.address(92),
  toAsset: data.address(112),
  amountIn: data.uint(132),
  amountOutMin: data.compact(167, 168),
});

// LibRouter.getData(): byte 274 holds the fee count, followed by three
// arrays of compact descriptors (asset, receiver, amount), 3 bytes per entry.
// transferFees() transfers these separately from the swap's amountIn.
// Only fees paid in the input asset belong in its total debit.
// https://sourcify.dev/server/v2/contract/42161/0x20F6ee51340aDEed01A59B0e65cB3703f3dc860c?fields=sources
// https://docs.fly.trade/developers/api-reference/evm-swap-integration-guide#step-1-get-a-quote
export const decodeDexAggregatorInputFee = (data: PackedReader): string => {
  const count = Number(data.uint(274, 1));
  const inputAsset = new BigNumber(data.address(92).slice(2), 16);
  let total = new BigNumber(0);
  for (let index = 0; index < count; index++) {
    const assetOffset = 275 + index * 3;
    const amountOffset = 275 + (count * 2 + index) * 3;
    const asset = data.compact(assetOffset, assetOffset + 1);
    const amount = data.compact(amountOffset, amountOffset + 1);
    if (inputAsset.eq(asset)) total = total.plus(amount);
  }
  return total.toFixed(0);
};
