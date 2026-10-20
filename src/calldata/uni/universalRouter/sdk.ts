import { CommandParser, CommandType } from "@uniswap/universal-router-sdk";
import type {
  Param,
  UniversalRouterVersion,
} from "@uniswap/universal-router-sdk";
import { utils } from "ethers";

const planTypes = ["bytes", "bytes[]"];

export const readPlan = (input: string) => {
  const [commands, inputs] = utils.defaultAbiCoder.decode(planTypes, input);
  return { commands: commands as string, inputs: inputs as string[] };
};

export const paramValues = (params: readonly Param[]): Record<string, any> =>
  Object.fromEntries(params.map(({ name, value }) => [name, value]));

// The SDK selects version-specific parameter schemas and V3 path parsers.
export const decodeCommand = (
  command: number,
  input: string,
  version: UniversalRouterVersion
) => {
  const calldata = CommandParser.INTERFACE.encodeFunctionData(
    "execute(bytes,bytes[])",
    [utils.hexlify(command), [input]]
  );
  return CommandParser.parseCalldata(calldata, version).commands[0];
};

export const decodeV4Action = (
  action: number,
  input: string,
  version: UniversalRouterVersion
) => {
  const plan = utils.defaultAbiCoder.encode(planTypes, [
    utils.hexlify(action),
    [input],
  ]);
  const decoded = decodeCommand(CommandType.V4_SWAP, plan, version).params[0];
  return { name: decoded.name, params: paramValues(decoded.value) };
};
