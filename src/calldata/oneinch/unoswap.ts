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
import { isSameAddress, normalizeEeeeToken, NULL_ADDRESS } from "../../utils";
import type { DecodeCalldataResult, TxWithChainId } from "../types";
import { getV2InputPair } from "../uni/universalRouter/v2";
import { ETH_SENTINEL, getCurveOutput } from "./curve";
import {
  CURVE_POOLS,
  V3_FACTORIES,
  V3_INIT_CODE_HASH,
  V3_FEES,
  EXTRA_V2_FACTORIES,
  EXTRA_CANDIDATE_TOKENS,
} from "./config";

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
  candidates: readonly string[],
  chainId: number
): string | undefined => {
  // Router V6 ProtocolLib stores protocol in bits 253..255 and direction in bit 247.
  // https://etherscan.io/address/0x111111125421ca6dc452d289314280a0f8842a65#code
  const protocol = dex.shr(253).toNumber();
  const pool = addressOf(dex);
  if (protocol === 2) return getCurveOutput(input, pool, dex, chainId);
  if (protocol > 1 || (protocol === 1 && !V3_FACTORIES[chainId]))
    return undefined;
  const zeroForOne = dex.shr(247).and(1).eq(1);
  for (const output of candidates) {
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
      for (const [factory, codeHash] of EXTRA_V2_FACTORIES[chainId] || []) {
        if (isSameAddress(poolAddress(factory, salt, codeHash), pool))
          return output;
      }
      continue;
    }
    for (const fee of V3_FEES) {
      const salt = keccak256(
        defaultAbiCoder.encode(
          ["address", "address", "uint24"],
          [token0, token1, fee]
        )
      );
      if (
        isSameAddress(
          poolAddress(V3_FACTORIES[chainId], salt, V3_INIT_CODE_HASH),
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
  const skipsWrap = nativeInput && !args.dex.shr(251).and(1).isZero();
  // Only Curve can consume unwrapped msg.value; its coin and ETH flags are checked below.
  if (skipsWrap && !args.dex.shr(253).eq(2)) return null;
  const input = nativeInput
    ? skipsWrap
      ? ETH_SENTINEL
      : wrapped
    : addressOf(args.token);
  if (isSameAddress(input, NULL_ADDRESS)) return null;
  // shortcut: only SDK-known assets on configured V2/V3 factories are resolved;
  // add independently verified factory/asset metadata for new route fixtures.
  const candidates = [
    ...new Set(
      [
        ...(EXTRA_CANDIDATE_TOKENS[tx.chainId] || []),
        ...[...STABLE_TOKEN_POOL, ...NATIVE_AND_DERIVATIVE_TOKEN_POOL]
          .filter((token) => token.chain === chain.serverId)
          .map((token) => token.id.toLowerCase()),
        ...Object.values(CURVE_POOLS[tx.chainId] || {}).flatMap(
          ({ coins }) => coins
        ),
        wrapped.toLowerCase(),
      ].filter((id) => isAddress(id) && !isSameAddress(id, ETH_SENTINEL))
    ),
  ];
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
  const normalizedOutput = normalizeEeeeToken(output, chain.nativeTokenAddress);
  return {
    fromToken: nativeInput ? chain.nativeTokenAddress : input,
    fromTokenAmount: amount.toFixed(0),
    toToken:
      unwrap || isSameAddress(normalizedOutput, chain.nativeTokenAddress)
        ? chain.nativeTokenAddress
        : toChecksumAddress(output),
    minReceiveToTokenAmount: args.minReturn.toString(),
    toTokenReceiver: tx.from,
  };
};
