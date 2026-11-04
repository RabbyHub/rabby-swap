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

// Official default-factory deployments and CREATE2 layout:
// https://github.com/Uniswap/sdks/blob/main/sdks/sdk-core/src/addresses.ts
// https://github.com/Uniswap/sdks/blob/main/sdks/v3-sdk/src/utils/computePoolAddress.ts
const factory = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const initCodeHash =
  "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54";
const factoryChains = [1, 10, 137, 42161];
const fees = [100, 500, 3000, 10000];

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
  if (protocol > 1) return undefined;
  const pool = addressOf(dex);
  const zeroForOne = dex.shr(247).and(1).eq(1);
  for (const { id: output } of candidates) {
    if (isSameAddress(input, output)) continue;
    const [token0, token1] = [input.toLowerCase(), output.toLowerCase()].sort();
    if (zeroForOne !== isSameAddress(input, token0)) continue;
    if (protocol === 0) {
      if (isSameAddress(getV2InputPair(chainId, [input, output]) || "", pool))
        return output;
      continue;
    }
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
      if (isSameAddress(`0x${hash.slice(-40)}`, pool)) return output;
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
    !factoryChains.includes(tx.chainId) ||
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
  // shortcut: only SDK-known assets on default-factory V2/V3 pools are resolved;
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
