import { Interface } from "@ethersproject/abi";
import BigNumber from "bignumber.js";
import { getNativeTokenAddress } from "../../chain";
import type { DecodeCalldataResult, TxWithChainId } from "../types";
import { UniABI } from "./abi";
import { chainToken, finishSwap } from "./shared";
import type { Context, Swap } from "./shared";
import { walkCommands } from "./universalRouter/commands";
import { getRouterProfile } from "./universalRouter/profiles";
import { normalizeUniAssets } from "./assets";

const uniInterface = new Interface(UniABI);

export const decodeCalldata = (tx: TxWithChainId): DecodeCalldataResult => {
  const native = getNativeTokenAddress(tx.chainId);
  const transaction = uniInterface.parseTransaction({ data: tx.data });
  const ctx: Context = {
    chainId: tx.chainId,
    native,
    sender: tx.from,
    // SwapProxy calls execute normally, so the Router's msgSender() is the
    // proxy, while tx.from remains the user whose requested payout we verify.
    // https://github.com/Uniswap/universal-router/blob/main/contracts/SwapProxy.sol
    routerCaller: transaction.args.router ? tx.to : tx.from,
    // SwapProxy passes the actual Universal Router as an explicit argument.
    router: transaction.args.router || tx.to,
    proxyToken: transaction.args.token,
    proxyAmount: transaction.args.amount?.toString(),
    txValue: tx.value,
  };
  const profile = getRouterProfile(ctx.chainId, ctx.router);
  const swap: Swap = {};
  if (new BigNumber(ctx.txValue).gt(0))
    swap.pendingMinimums = { [ctx.native.toLowerCase()]: ctx.txValue };
  if (ctx.proxyToken && ctx.proxyAmount && ctx.proxyAmount !== "0") {
    swap.fromToken = ctx.proxyToken;
    swap.fromTokenAmount = ctx.proxyAmount;
    swap.inputAmountLocked = true;
    (swap.pendingMinimums ||= {})[
      chainToken(ctx.proxyToken, ctx.native).toLowerCase()
    ] = ctx.proxyAmount;
  }
  walkCommands(
    transaction.args.commands,
    transaction.args.inputs,
    swap,
    ctx,
    profile
  );

  return normalizeUniAssets(finishSwap(swap), tx.chainId, native);
};
