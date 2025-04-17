import { OpenApiService } from "@rabby-wallet/rabby-api";
import { CHAINS, CHAINS_ENUM } from "@debank/common";
import { QuoteParams, QuoteResult } from "./quote";
import { DEX_ENUM } from "./consts";
import { DEX_SPENDER_WHITELIST } from "./list";

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
    id:
      | "uniswap3"
      | "matcha"
      | "matcha_v2"
      | "openocean"
      | "1inch_v6"
      | "paraswap"
      | "kyberswap"
      | "odos"
      | "paraswap_v6"
      | "magpie"
      | "rabby";
    dex: DEX_ENUM;
  }) =>
  async (options: QuoteParams, api: OpenApiService): Promise<QuoteResult> => {
    if (!options.chainServerId || !options.nativeTokenAddress) {
      throw new Error(
        `lack chainServerId or nativeTokenAddress is not support}`
      );
    }

    const params: Record<string, any> = {
      id: options.userAddress,
      chain_id: options.chainServerId,
      dex_id:
        options.chain === CHAINS_ENUM.ETH
          ? id
          : `${options.chainServerId}_${id}`,
      pay_token_id: options.fromToken,
      pay_token_raw_amount: options.amount,
      receive_token_id: options.toToken,
      slippage: options.slippage / 100,
    };
    if (options.fee) {
      params.fee = true;
    }
    if (options.insufficient) {
      params.no_pre_exec = true;
    }

    const data = await api.getSwapQuote(params as any);

    const isNativeToken = isSameAddress(
      data.pay_token.id,
      options.nativeTokenAddress
    );

    return {
      dexFeeDesc: data.dex_fee_desc,
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
      spender:
        dex === DEX_ENUM.PARASWAP
          ? DEX_SPENDER_WHITELIST[DEX_ENUM.PARASWAP][
              options.chain as keyof (typeof DEX_SPENDER_WHITELIST)[DEX_ENUM.PARASWAP]
            ]
          : data.dex_swap_to,

      gasUsed: (data as any).gas_used,
      origin: data,
    };
  };
