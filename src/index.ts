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

import { Encoder } from "./Encoder.ts";
export { Encoder };
import type { EncoderOptions } from "./Encoder.ts";
export type { EncoderOptions };

// PackCtrl Interface:
export interface PackCtrl {
  from_obj(object: unknown): [boolean, unknown, unknown]; // [as_dict, object_type,
data]
  options: EncoderOptions;
}
