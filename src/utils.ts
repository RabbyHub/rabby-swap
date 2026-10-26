import { OpenApiService } from "@rabby-wallet/rabby-api";
import { CHAINS_ENUM } from "@debank/common";
import BigNumber from "bignumber.js";
import { QuoteParams, QuoteResult } from "./quote";
import type { DecodeCalldataResult } from "./calldata/types";
import { ARC_CHAIN_ID, ARC_ERC20_USDC, ARC_NATIVE_SCALE, DEX_ENUM } from "./consts";
import { DEX_SPENDER_WHITELIST } from "./list";
import { getChainByEnum } from "./chain";

export const isSameAddress = (addr1: string, addr2: string) => {
  if (typeof addr1 !== "string" || typeof addr2 !== "string") return false;
  return addr1.toLowerCase() === addr2.toLowerCase();
};

export const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

/** 按 DEX 指定的原生币标记转换；未配置标记时保留原值。 */
export const normalizeToken = (
  token: string,
  nativeTokenAddress: string,
  nativeTokenMarker: string | undefined
): string =>
  nativeTokenMarker !== undefined && isSameAddress(token, nativeTokenMarker)
    ? nativeTokenAddress
    : token;

const EEEE_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

/**
 * 1inch、Sushi、ParaSwap 等用 0xEeee… 占位表示原生币。
 * 转为项目使用的链 native 标识以便报价比对，其他代币地址保留原值。
 */
export const normalizeEeeeToken = (
  token: string,
  nativeTokenAddress: string
): string =>
  normalizeToken(token, nativeTokenAddress, EEEE_ADDRESS);

/**
 * Magpie、Pancake 等约定零地址表示原生币，需转为项目使用的链 native 标识。
 * 与 0xEeee… 的约定分开处理，避免扩大各 DEX 的原生币识别范围。
 */
export const normalizeZeroAddressToken = (
  token: string,
  nativeTokenAddress: string
): string =>
  normalizeToken(token, nativeTokenAddress, NULL_ADDRESS);

export const resolveToTokenReceiver = (
  encodedReceiver: string,
  txFrom: string
) => (isSameAddress(encodedReceiver, NULL_ADDRESS) ? txFrom : encodedReceiver);

const ARC = "ARC" as CHAINS_ENUM;

/**
 * Arc 原生 USDC 为 18 位，ERC20 接口为 6 位；往返转换会截断末尾 12 位。
 * 仅在金额比较时换算请求值，保留 calldata 解码值、报价和交易金额。
 * https://docs.arc.io/arc/concepts/stablecoin-native-model#two-interfaces-one-balance
 */
export const getComparableNativeInputAmount = (
  requestedAmount: string,
  decoded: DecodeCalldataResult,
  chainId: number,
  native: string
): string => {
  if (
    decoded.fromTokenAmount !== requestedAmount &&
    chainId === ARC_CHAIN_ID &&
    isSameAddress(decoded.fromToken, native) &&
    !isSameAddress(native, ARC_ERC20_USDC)
  ) {
    return new BigNumber(requestedAmount)
      .idiv(ARC_NATIVE_SCALE)
      .times(ARC_NATIVE_SCALE)
      .toFixed(0);
  }
  return requestedAmount;
};

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
  chain: CHAINS_ENUM;
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
    return new BigNumber(amount).times(ARC_NATIVE_SCALE).toFixed(0);
  }

  return isSameAddress(payTokenId, nativeTokenAddress) ? amount : "0";
};

export const generateGetQuote =
  ({
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
      | "paraswap_v6"
      | "magpie"
      | "sushi"
      | "uni"
      | "pancake";
    dex: DEX_ENUM;
  }) =>
  async (options: QuoteParams, api: OpenApiService): Promise<QuoteResult> => {
    const chain = getChainByEnum(options.chain);
    const chainServerId = chain?.serverId ?? options.chainServerId;
    const nativeTokenAddress =
      chain?.nativeTokenAddress ?? options.nativeTokenAddress;
    if (!chainServerId || !nativeTokenAddress) {
      throw new Error(
        `lack chainServerId or nativeTokenAddress is not support}`
      );
    }

    const params: Record<string, any> = {
      id: options.userAddress,
      chain_id: chainServerId,
      dex_id:
        options.chain === CHAINS_ENUM.ETH && dex !== DEX_ENUM.PANCAKESWAP
          ? id
          : `${chainServerId}_${id}`,
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
          nativeTokenAddress,
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
