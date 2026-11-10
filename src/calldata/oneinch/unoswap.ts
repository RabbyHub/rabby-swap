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
import { WrapTokenAddressMap } from "../../list";
import { isSameAddress, NULL_ADDRESS } from "../../utils";
import type { DecodeCalldataResult, TxWithChainId } from "../types";
import { getV2InputPair } from "../uni/universalRouter/v2";
import { getCurveOutput } from "./curve";

// Official chain-specific deployments and CREATE2 layout:
// https://github.com/Uniswap/sdks/blob/main/sdks/sdk-core/src/addresses.ts
// https://github.com/Uniswap/sdks/blob/main/sdks/v3-sdk/src/utils/computePoolAddress.ts
const defaultV3Factory = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const v3Factories: Record<number, string> = {
  1: defaultV3Factory,
  10: defaultV3Factory,
  56: "0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7",
  137: defaultV3Factory,
  8453: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
  42161: defaultV3Factory,
};
const initCodeHash =
  "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54";
const fees = [100, 500, 3000, 10000];

// BSC Pancake V1/V2: INIT_CODE_PAIR_HASH() and getPair() checked on-chain.
// https://bscscan.com/address/0xbcfccbde45ce874adcb698cc183debcf17952812#readContract
// https://github.com/pancakeswap/pancake-swap-sdk/blob/master/src/constants.ts
const extraV2Factories: Record<number, readonly [string, string][]> = {
  56: [
    [
      "0xbcfccbde45ce874adcb698cc183debcf17952812",
      "0xd0d4c4cd0848c93cb4fd1f498d7013ee6bfb25783ea21593d5834f5d250ece66",
    ],
    [
      "0xca143ce32fe78f1f7019d7d551a6402fc5350c73",
      "0x00fb7f630766e6a796048ea87d01acd3068e8ff67d078148a3fa3f4a84f69bd5",
    ],
  ],
};

const poolAddress = (factory: string, salt: string, codeHash: string) => {
  const hash = soliditySha3Raw(
    { type: "bytes1", value: "0xff" },
    { type: "address", value: factory },
    { type: "bytes32", value: salt },
    { type: "bytes32", value: codeHash }
  );
  return `0x${hash.slice(-40)}`;
};

const addressOf = (value: Result[number]) =>
  toChecksumAddress(
    `0x${value.mask(160).toHexString().slice(2).padStart(40, "0")}`
  );

const getPoolOutput = (
  input: string,
  dex: Result[number],
  candidates: readonly { id: string }[],
  chainId: number
): string | undefined => {
  // Router V6 ProtocolLib stores protocol in bits 253..255 and direction in bit 247.
  // https://etherscan.io/address/0x111111125421ca6dc452d289314280a0f8842a65#code
  const protocol = dex.shr(253).toNumber();
  const pool = addressOf(dex);
  if (protocol === 2) return getCurveOutput(input, pool, dex, chainId);
  if (protocol > 1) return undefined;
  const zeroForOne = dex.shr(247).and(1).eq(1);
  for (const { id: output } of candidates) {
    if (isSameAddress(input, output)) continue;
    const [token0, token1] = [input.toLowerCase(), output.toLowerCase()].sort();
    if (zeroForOne !== isSameAddress(input, token0)) continue;
    if (protocol === 0) {
      if (isSameAddress(getV2InputPair(chainId, [input, output]) || "", pool))
        return output;
      const salt = soliditySha3Raw(
        { type: "address", value: token0 },
        { type: "address", value: token1 }
      );
      for (const [factory, codeHash] of extraV2Factories[chainId] || []) {
        if (isSameAddress(poolAddress(factory, salt, codeHash), pool))
          return output;
      }
      continue;
    }
    for (const fee of fees) {
      const salt = keccak256(
        defaultAbiCoder.encode(
          ["address", "address", "uint24"],
          [token0, token1, fee]
        )
      );
      if (
        isSameAddress(
          poolAddress(v3Factories[chainId], salt, initCodeHash),
          pool
        )
      )
        return output;
    }
  }
  return undefined;
};

export const decodeUnoswap = (
  args: Result,
  tx: TxWithChainId
): DecodeCalldataResult | null => {
  const chain = getChainById(tx.chainId);
  const nativeInput = args.token === undefined;
  const value = new BigNumber(tx.value);
  const amount = nativeInput ? value : new BigNumber(args.amount.toString());
  if (
    !chain ||
    !v3Factories[tx.chainId] ||
    !isAddress(tx.from) ||
    isSameAddress(tx.from, NULL_ADDRESS) ||
    !amount.isInteger() ||
    !amount.gt(0) ||
    (!nativeInput && !value.isZero()) ||
    args.minReturn.isZero()
  )
    return null;
  const wrapped =
    WrapTokenAddressMap[chain.enum as keyof typeof WrapTokenAddressMap];
  if (!wrapped) return null;
  // Skipping the ETH deposit would spend the router's existing WETH balance.
  if (nativeInput && !args.dex.shr(251).and(1).isZero()) return null;
  const input = nativeInput ? wrapped : addressOf(args.token);
  if (isSameAddress(input, NULL_ADDRESS)) return null;
  // shortcut: only SDK-known assets on configured V2/V3 factories are resolved;
  // add independently verified factory/asset metadata for new route fixtures.
  const candidates = [
    ...STABLE_TOKEN_POOL,
    ...NATIVE_AND_DERIVATIVE_TOKEN_POOL,
    { chain: chain.serverId, id: wrapped },
  ].filter((token) => token.chain === chain.serverId && isAddress(token.id));
  const dexes = [args.dex, args.dex2, args.dex3].filter(
    (dex) => dex !== undefined
  );
  let output = input;
  for (const dex of dexes) {
    const next = getPoolOutput(output, dex, candidates, tx.chainId);
    if (!next) return null;
    output = next;
  }
  const unwrap = !dexes[dexes.length - 1].shr(252).and(1).isZero();
  if (unwrap && !isSameAddress(output, wrapped)) return null;
  return {
    fromToken: nativeInput ? chain.nativeTokenAddress : input,
    fromTokenAmount: amount.toFixed(0),
    toToken: unwrap ? chain.nativeTokenAddress : toChecksumAddress(output),
    minReceiveToTokenAmount: args.minReturn.toString(),
    toTokenReceiver: tx.from,
  };
};
