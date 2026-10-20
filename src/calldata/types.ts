export interface Tx {
  from: string;
  to: string;
  data: string;
  value: string;
  chainId?: number;
  gas?: number;
  gasPrice?: string;
}

export interface TxWithChainId extends Tx {
  chainId: number;
}

export interface DecodeCalldataOptions {
  nativeTokenAddress?: string;
}

export interface DecodeCalldataResult {
  fromToken: string;
  fromTokenAmount: string;
  toToken: string;
  minReceiveToTokenAmount: string;
  toTokenReceiver: string;
}
