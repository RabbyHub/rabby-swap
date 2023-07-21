import { OpenApiService } from "@rabby-wallet/rabby-api";
import { CHAINS, CHAINS_ENUM } from "@debank/common";
import { QuoteParams, QuoteResult } from "./quote";

export const isSameAddress = (addr1: string, addr2: string) => {
  if (typeof addr1 !== "string" || typeof addr2 !== "string") return false;
  return addr1.toLowerCase() === addr2.toLowerCase();
};

export const generateGetQuote =
  ({
    SUPPORT_CHAINS,
    id,
    dex,
  }: {
    SUPPORT_CHAINS: CHAINS_ENUM[];
    id: string;
    dex: string;
  }) =>
  async (options: QuoteParams, api: OpenApiService): Promise<QuoteResult> => {
    if (!SUPPORT_CHAINS.includes(options.chain)) {
      throw new Error(`${CHAINS[options.chain]} is not support on ${dex}`);
    }

    const data = await api.getSwapQuote({
      id: options.userAddress,
      chain_id: CHAINS[options.chain].serverId,
      dex_id:
        options.chain === CHAINS_ENUM.ETH
          ? id
          : `${CHAINS[options.chain].serverId}_${id}`,
      pay_token_id: options.fromToken,
      pay_token_raw_amount: options.amount,
      receive_token_id: options.toToken,
      slippage: options.slippage / 100,
    } as any);

    const isNativeToken = isSameAddress(
      data.pay_token.id,
      CHAINS[options.chain].nativeTokenAddress
    );

    return {
      tx: {
        data: data.dex_swap_calldata,
        value: isNativeToken ? options.amount : "0",
        to: data.dex_swap_to,
        from: options.userAddress,
      },
      fromToken: data.pay_token.id,
      fromTokenAmount: options.amount,
      fromTokenDecimals: data.pay_token.decimals,
      toToken: data.receive_token.id,
      toTokenAmount: data.receive_token_raw_amount + "",
      toTokenDecimals: data.receive_token.decimals,
      spender: data.dex_swap_to,
    };
  };
