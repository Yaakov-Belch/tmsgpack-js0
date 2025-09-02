import assert from "assert";
import { encode, decode, decodeAsync } from "../src/index.ts";
import type { DecoderOptions } from "../src/index.ts";
import { pctrl, uctrl } from "./test-utils.ts";

describe("decode with max${Type}Length specified", () => {
  async function* createStream<T>(input: T) {
    yield input;
  }

  context("maxStrLength", () => {
    const input = encode("foo", pctrl());
    const options = { maxStrLength: 1 } satisfies DecoderOptions;

    it("throws errors (synchronous)", () => {
      assert.throws(() => {
        decode(input, uctrl(options));
      }, /max length exceeded/i);
    });

    it("throws errors (asynchronous)", async () => {
      await assert.rejects(async () => {
        await decodeAsync(createStream(input), uctrl(options));
      }, /max length exceeded/i);
    });
  });

  context("maxBinLength", () => {
    const input = encode(Uint8Array.from([1, 2, 3]), pctrl());
    const options = { maxBinLength: 1 } satisfies DecoderOptions;

    it("throws errors (synchronous)", () => {
      assert.throws(() => {
        decode(input, uctrl(options));
      }, /max length exceeded/i);
    });

    it("throws errors (asynchronous)", async () => {
      await assert.rejects(async () => {
        await decodeAsync(createStream(input), uctrl(options));
      }, /max length exceeded/i);
    });
  });

  context("maxArrayLength", () => {
    const input = encode([1, 2, 3], pctrl());
    const options = { maxArrayLength: 1 } satisfies DecoderOptions;

    it("throws errors (synchronous)", () => {
      assert.throws(() => {
        decode(input, uctrl(options));
      }, /max length exceeded/i);
    });

    it("throws errors (asynchronous)", async () => {
      await assert.rejects(async () => {
        await decodeAsync(createStream(input), uctrl(options));
      }, /max length exceeded/i);
    });
  });

  context("maxMapLength", () => {
    const input = encode({ foo: 1, bar: 1, baz: 3 }, pctrl());
    const options = { maxMapLength: 1 } satisfies DecoderOptions;

    it("throws errors (synchronous)", () => {
      assert.throws(() => {
        decode(input, uctrl(options));
      }, /max length exceeded/i);
    });

    it("throws errors (asynchronous)", async () => {
      await assert.rejects(async () => {
        await decodeAsync(createStream(input), uctrl(options));
      }, /max length exceeded/i);
    });
  });
});
