// Main Functions:

import { encode } from "./encode.ts";
export { encode };

import { decode, decodeMulti } from "./decode.ts";
export { decode, decodeMulti };

import { decodeAsync, decodeArrayStream, decodeMultiStream } from "./decodeAsync.ts";
export { decodeAsync, decodeArrayStream, decodeMultiStream };

import { Decoder } from "./Decoder.ts";
export { Decoder };
import type { DecoderOptions } from "./Decoder.ts";
export type { DecoderOptions };
import { DecodeError } from "./DecodeError.ts";
export { DecodeError };

export interface UnpackCtrl {
  fromDict(objectType: unknown, data: Record<string, unknown>): unknown;
  fromList(objectType: unknown, data: Array<unknown>): unknown;
  options: DecoderOptions;
}

import { Encoder } from "./Encoder.ts";
export { Encoder };
import type { EncoderOptions } from "./Encoder.ts";
export type { EncoderOptions };

export interface PackCtrl {
  fromObj(object: unknown): [boolean, unknown, unknown]; // [asDict, objectType, data]
  options: EncoderOptions;
}
