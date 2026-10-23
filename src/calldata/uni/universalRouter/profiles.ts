import {
  UNIVERSAL_ROUTER_ADDRESS,
  UniversalRouterVersion,
} from "@uniswap/universal-router-sdk";
import { isSameAddress } from "../../../utils";

export interface RouterProfile {
  version: UniversalRouterVersion;
  commandMask: number;
}

export const getRouterProfile = (
  chainId: number,
  router: string
): RouterProfile => {
  // Resolve the actual deployment instead of assuming the quote's API version.
  // 2.1.2 keeps the 2.1.1 calldata layout; its addresses are supplied by the SDK.
  // https://developers.uniswap.org/docs/changelog/active-notifications/sunset-of-universal-router-2-0-and-2-1-1
  const versions = [
    UniversalRouterVersion.V2_1_2,
    // Retain the deployments accepted before the 2.1.2 API migration.
    chainId === 4663 || chainId === 5042
      ? UniversalRouterVersion.V2_1_1
      : UniversalRouterVersion.V2_0,
  ];
  for (const version of versions) {
    let expectedRouter: string;
    try {
      expectedRouter = UNIVERSAL_ROUTER_ADDRESS(version, chainId);
    } catch {
      // This version is not deployed on the chain; never guess its layout.
      continue;
    }
    if (!isSameAddress(router, expectedRouter)) continue;

    // The SDK's zkSync 2.0 address aliases the deployed 1.2 Router. Its verified
    // Commands.sol uses a 5-bit mask and has no V4 swap command.
    if (chainId === 324 && version === UniversalRouterVersion.V2_0) {
      return { version: UniversalRouterVersion.V1_2, commandMask: 0x1f };
    }
    return {
      version,
      commandMask: version === UniversalRouterVersion.V2_0 ? 0x3f : 0x7f,
    };
  }
  throw new Error(
    `Unknown Universal Router version for chain ${chainId}, router ${router}; supported quote deployments (${versions.join(
      ", "
    )})`
  );
};
