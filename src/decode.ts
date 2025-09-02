import { Decoder } from "./Decoder.ts";
import type { UnpackCtrl } from "./index.ts";

/**
 * It decodes a single MessagePack object in a buffer.
 *
 * This is a synchronous decoding function.
 * See other variants for asynchronous decoding: {@link decodeAsync}, {@link decodeMultiStream}, or {@link decodeArrayStream}.
 *
 * @throws {@link RangeError} if the buffer is incomplete, including the case where the buffer is empty.
 * @throws {@link DecodeError} if the buffer contains invalid data.
 */
export function decode(
  buffer: ArrayLike<number> | ArrayBufferView | ArrayBufferLike,
  unpack_ctrl: UnpackCtrl,
): unknown {
  const decoder = new Decoder(unpack_ctrl);
  return decoder.decode(buffer);
}

/**
 * It decodes multiple MessagePack objects in a buffer.
 * This is corresponding to {@link decodeMultiStream}.
 *
 * @throws {@link RangeError} if the buffer is incomplete, including the case where the buffer is empty.
 * @throws {@link DecodeError} if the buffer contains invalid data.
 */
export function decodeMulti(
  buffer: ArrayLike<number> | BufferSource,
  unpack_ctrl: UnpackCtrl,
): Generator<unknown, void, unknown> {
  const decoder = new Decoder(unpack_ctrl);
  return decoder.decodeMulti(buffer);
}
