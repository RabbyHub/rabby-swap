import { OpenApiService } from "@rabby-wallet/rabby-api";
import { CHAINS, CHAINS_ENUM } from "@debank/common";
import BigNumber from "bignumber.js";
import { QuoteParams, QuoteResult } from "./quote";
import { ARC_ERC20_USDC, DEX_ENUM } from "./consts";
import { DEX_SPENDER_WHITELIST } from "./list";

export const isSameAddress = (addr1: string, addr2: string) => {
  if (typeof addr1 !== "string" || typeof addr2 !== "string") return false;
  return addr1.toLowerCase() === addr2.toLowerCase();
};

export const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

export const resolveToTokenReceiver = (
  encodedReceiver: string,
  txFrom: string
) => (isSameAddress(encodedReceiver, NULL_ADDRESS) ? txFrom : encodedReceiver);

const ARC = "ARC" as CHAINS_ENUM;
const ARC_USDC_TO_NATIVE_SCALE = 1e12;

/** Uni quotes 0x3600 USDC as a native path on Arc; attach scaled native value. */
export const resolveSwapTxValue = ({
  dex,
  chain,
  fromToken,
  payTokenId,
  nativeTokenAddress,
  amount,
}: {
  dex: DEX_ENUM;
  chain?: CHAINS_ENUM;
  fromToken: string;
  payTokenId: string;
  nativeTokenAddress: string;
  amount: string;
}) => {
  if (
    dex === DEX_ENUM.UNI &&
    chain === ARC &&
    isSameAddress(fromToken, ARC_ERC20_USDC)
  ) {
    return new BigNumber(amount).times(ARC_USDC_TO_NATIVE_SCALE).toFixed(0);
  }

  return isSameAddress(payTokenId, nativeTokenAddress) ? amount : "0";
};

export const generateGetQuote =
  ({
    SUPPORT_CHAINS,
    id,
    dex,
  }: {
    SUPPORT_CHAINS: CHAINS_ENUM[];
    id:
      | "matcha"
      | "matcha_v2"
      | "openocean"
      | "1inch_v6"
      | "paraswap"
      | "kyberswap"
      | "odos"
      | "paraswap_v6"
      | "magpie"
      | "sushi"
      | "rabby"
      | "uni";
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
      fee_rate: options.feeRate,
    };
    if (options.fee) {
      params.fee = true;
    }
    if (options.insufficient) {
      params.no_pre_exec = true;
    }

    const data = await api.getSwapQuote(params as any);

    return {
      dexFeeDesc: data.dex_fee_desc,
      tx: {
        data: data.dex_swap_calldata,
        value: resolveSwapTxValue({
          dex,
          chain: options.chain,
          fromToken: options.fromToken,
          payTokenId: data.pay_token.id,
          nativeTokenAddress: options.nativeTokenAddress,
          amount: options.amount,
        }),
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
        dex === DEX_ENUM.PARASWAP ||
        (dex === DEX_ENUM.UNI && options.chain === ARC)
          ? DEX_SPENDER_WHITELIST[dex][
              options.chain as keyof (typeof DEX_SPENDER_WHITELIST)[typeof dex]
            ]
          : data.dex_swap_to,

      gasUsed: (data as any).gas_used,
      origin: data,
    };
  };
