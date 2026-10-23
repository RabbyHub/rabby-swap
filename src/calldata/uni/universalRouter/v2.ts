import { isAddress, soliditySha3Raw, toChecksumAddress } from "web3-utils";
import {
  UNI_V2_FACTORY_ADDRESSES,
  UNI_V2_PAIR_INIT_CODE_HASH,
} from "../../../consts";

// A mixed route can pay directly into the next V2 pair instead of the Router.
// Use the official chain-specific factory and CREATE2 derivation; never guess a
// mainnet factory when deployment metadata is missing.
// https://github.com/Uniswap/sdks/blob/main/sdks/universal-router-sdk/src/entities/actions/uniswap.ts
// https://github.com/Uniswap/sdks/blob/main/sdks/v2-sdk/src/entities/pair.ts
export const getV2InputPair = (
  chainId: number,
  path: readonly string[]
): string | undefined => {
  const factoryAddress = UNI_V2_FACTORY_ADDRESSES[chainId];
  if (!factoryAddress) return undefined;
  if (!isAddress(path[0]) || !isAddress(path[1])) {
    throw new Error("Invalid V2 token address");
  }
  const [token0, token1] = path
    .slice(0, 2)
    .map((token) => token.toLowerCase())
    .sort();
  if (token0 === token1)
    throw new Error("V2 pair requires two distinct tokens");
  const salt = soliditySha3Raw(
    { type: "address", value: token0 },
    { type: "address", value: token1 }
  );
  const hash = soliditySha3Raw(
    { type: "bytes1", value: "0xff" },
    { type: "address", value: factoryAddress },
    { type: "bytes32", value: salt },
    { type: "bytes32", value: UNI_V2_PAIR_INIT_CODE_HASH }
  );
  return toChecksumAddress(`0x${hash.slice(-40)}`);
};
