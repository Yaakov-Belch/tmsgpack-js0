import { Decoder } from "./Decoder.ts";
import { ensureAsyncIterable } from "./utils/stream.ts";
import type { DecoderOptions } from "./Decoder.ts";
import type { ReadableStreamLike } from "./utils/stream.ts";
/**
 * @throws {@link RangeError} if the buffer is incomplete, including the case where the buffer is empty.
 * @throws {@link DecodeError} if the buffer contains invalid data.
 */
export async function decodeAsync(
  streamLike: ReadableStreamLike<ArrayLike<number> | BufferSource>,
  options?: DecoderOptions,
): Promise<unknown> {
  const stream = ensureAsyncIterable(streamLike);
  const decoder = new Decoder(options);
  return decoder.decodeAsync(stream);
}

/**
 * @throws {@link RangeError} if the buffer is incomplete, including the case where the buffer is empty.
 * @throws {@link DecodeError} if the buffer contains invalid data.
 */
export function decodeArrayStream(
  streamLike: ReadableStreamLike<ArrayLike<number> | BufferSource>,
  options?: DecoderOptions,
): AsyncGenerator<unknown, void, unknown> {
  const stream = ensureAsyncIterable(streamLike);
  const decoder = new Decoder(options);
  return decoder.decodeArrayStream(stream);
}

/**
 * @throws {@link RangeError} if the buffer is incomplete, including the case where the buffer is empty.
 * @throws {@link DecodeError} if the buffer contains invalid data.
 */
export function decodeMultiStream(
  streamLike: ReadableStreamLike<ArrayLike<number> | BufferSource>,
  options?: DecoderOptions,
): AsyncGenerator<unknown, void, unknown> {
  const stream = ensureAsyncIterable(streamLike);
  const decoder = new Decoder(options);
  return decoder.decodeStream(stream);
}
