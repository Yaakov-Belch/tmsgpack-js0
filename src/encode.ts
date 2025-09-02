import { Encoder } from "./Encoder.ts";
import type { PackCtrl } from "./index.ts";

/**
 * It encodes `value` in the MessagePack format and
 * returns a byte buffer.
 *
 * The returned buffer is a slice of a larger `ArrayBuffer`, so you have to use its `#byteOffset` and `#byteLength` in order to convert it to another typed arrays including NodeJS `Buffer`.
 */
export function encode(
  value: unknown,
  pack_ctrl: PackCtrl,
): Uint8Array {
  const encoder = new Encoder(pack_ctrl);
  return encoder.encodeSharedRef(value);
}
