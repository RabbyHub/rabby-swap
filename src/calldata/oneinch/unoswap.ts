import { defaultAbiCoder } from "@ethersproject/abi";
import type { Result } from "@ethersproject/abi";
import BigNumber from "bignumber.js";
import {
  isAddress,
  keccak256,
  soliditySha3Raw,
  toChecksumAddress,
} from "web3-utils";
import {
  STABLE_TOKEN_POOL,
  NATIVE_AND_DERIVATIVE_TOKEN_POOL,
} from "../../tokenPools";
import { getChainById } from "../../chain";
import { isSameAddress, NULL_ADDRESS } from "../../utils";
import type { DecodeCalldataResult, TxWithChainId } from "../types";

// Official default-factory deployments and CREATE2 layout:
// https://github.com/Uniswap/sdks/blob/main/sdks/sdk-core/src/addresses.ts
// https://github.com/Uniswap/sdks/blob/main/sdks/v3-sdk/src/utils/computePoolAddress.ts
const factory = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const initCodeHash =
  "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54";
const factoryChains = [1, 10, 137, 42161];
const fees = [100, 500, 3000, 10000];

export const decodeUnoswap = (
  args: Result,
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = getChainById(tx.chainId);
  if (
    !chain ||
    !factoryChains.includes(tx.chainId) ||
    !isAddress(tx.from) ||
    isSameAddress(tx.from, NULL_ADDRESS) ||
    !new BigNumber(tx.value).isZero() ||
    args.amount.isZero() ||
    args.minReturn.isZero()
  )
    return null;
  // Router V6 ProtocolLib: protocol in bits 253..255, unwrap bit 252,
  // V3 zeroForOne bit 247. V3 callbacks debit pool tokens, not args.token.
  // https://etherscan.io/address/0x111111125421ca6dc452d289314280a0f8842a65#code
  if (!args.dex.shr(253).eq(1) || !args.dex.shr(252).and(1).isZero())
    return null;
  const addressOf = (value: Result[number]) =>
    toChecksumAddress(
      `0x${value.mask(160).toHexString().slice(2).padStart(40, "0")}`
    );
  const input = addressOf(args.token);
  const pool = addressOf(args.dex);
  const zeroForOne = args.dex.shr(247).and(1).eq(1);
  // shortcut: only SDK-known assets on default-factory V3 pools are resolved;
  // add independently verified factory/asset metadata for new route fixtures.
  const candidates = [
    ...STABLE_TOKEN_POOL,
    ...NATIVE_AND_DERIVATIVE_TOKEN_POOL,
  ].filter(
    (token) =>
      token.chain === chain.serverId &&
      isAddress(token.id) &&
      !isSameAddress(token.id, input)
  );
  for (const { id: output } of candidates) {
    const [token0, token1] = [input.toLowerCase(), output.toLowerCase()].sort();
    if (zeroForOne !== isSameAddress(input, token0)) continue;
    for (const fee of fees) {
      const salt = keccak256(
        defaultAbiCoder.encode(
          ["address", "address", "uint24"],
          [token0, token1, fee]
        )
      );
      const hash = soliditySha3Raw(
        { type: "bytes1", value: "0xff" },
        { type: "address", value: factory },
        { type: "bytes32", value: salt },
        { type: "bytes32", value: initCodeHash }
      );
      if (isSameAddress(`0x${hash.slice(-40)}`, pool)) {
        return {
          fromToken: input,
          fromTokenAmount: args.amount.toString(),
          toToken: toChecksumAddress(output),
          minReceiveToTokenAmount: args.minReturn.toString(),
          toTokenReceiver: tx.from,
        };
      }
    }
  }
  return null;
};
