import { NULL_ADDRESS, isSameAddress } from "../utils";

export const isSwapCalldataReceiverAllowed = (
  toTokenReceiver?: string | null,
  userAddress?: string | null
) => {
  const receiver = toTokenReceiver?.toString?.() || "";
  if (!receiver) {
    return true;
  }
  if (isSameAddress(receiver, NULL_ADDRESS)) {
    return true;
  }
  if (!userAddress) {
    return false;
  }
  return isSameAddress(receiver, userAddress);
};
