declare module 'abi-decoder' {
  interface decodedABI {
    name: string;
    params: {name: string; value: any; type: string}[];
  }
  export function addABI(abi: any): void;
  export function decodeMethod(calldata: string): decodedABI;
}