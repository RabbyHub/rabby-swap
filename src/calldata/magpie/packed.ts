import BigNumber from "bignumber.js";

export interface PackedSwap {
  receiver: string;
  fromAsset: string;
  toAsset: string;
  amountIn: string;
  amountOutMin: string;
}

// Offsets include the selector. Reads must stay inside the declared bytes payload.
export class PackedReader {
  private readonly hex: string;

  constructor(data: string, private readonly payloadLength: number) {
    this.hex = data.slice(2);
  }

  private read(offset: number, length: number) {
    if (offset < 68 || offset + length > 68 + this.payloadLength) {
      throw new Error(
        `Packed field points outside the Magpie bytes payload (offset ${offset}, length ${length})`
      );
    }
    return this.hex.slice(offset * 2, (offset + length) * 2);
  }

  address(offset: number) {
    return `0x${this.read(offset, 20)}`.toLowerCase();
  }

  uint(offset: number, length = 32) {
    return new BigNumber(this.read(offset, length), 16).toFixed(0);
  }

  compact(shiftOffset: number, pointerOffset: number) {
    const shift = Number(this.uint(shiftOffset, 1));
    const pointer = Number(this.uint(pointerOffset, 2));
    // Only the high (256 - shift) bits survive Solidity's shr.
    const significantBits = 256 - shift;
    const length = Math.ceil(significantBits / 8);
    return new BigNumber(this.uint(pointer, length))
      .idiv(new BigNumber(2).pow(length * 8 - significantBits))
      .toFixed(0);
  }
}
