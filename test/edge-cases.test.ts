// kind of hand-written fuzzing data
// any errors should not break Encoder/Decoder instance states
import assert from "assert";
import { encode, decodeAsync, decode, Encoder, Decoder, decodeMulti, decodeMultiStream } from "../src/index.ts";
import { pctrl, uctrl } from "./test-utils.ts";

function testEncoder(encoder: Encoder): void {
  const object = {
    foo: 1,
    bar: 2,
    baz: ["one", "two", "three"],
  };
  assert.deepStrictEqual(decode(encoder.encode(object), uctrl()), object);
}

function testDecoder(decoder: Decoder): void {
  const object = {
    foo: 1,
    bar: 2,
    baz: ["one", "two", "three"],
  };
  assert.deepStrictEqual(decoder.decode(encode(object, pctrl())), object);
}

describe("edge cases", () => {
  context("try to encode cyclic refs", () => {
    it("throws errors on arrays", () => {
      const encoder = new Encoder(pctrl());
      const cyclicRefs: Array<any> = [];
      cyclicRefs.push(cyclicRefs);
      assert.throws(() => {
        encoder.encode(cyclicRefs);
      }, /too deep/i);
      testEncoder(encoder);
    });

    it("throws errors on objects", () => {
      const encoder = new Encoder(pctrl());
      const cyclicRefs: Record<string, any> = {};
      cyclicRefs["foo"] = cyclicRefs;
      assert.throws(() => {
        encoder.encode(cyclicRefs);
      }, /too deep/i);
      testEncoder(encoder);
    });
  });

  context("try to encode unrecognized objects", () => {
    it("throws errors", () => {
      const encoder = new Encoder(pctrl());
      assert.throws(() => {
        encoder.encode(() => {});
      }, /unrecognized object/i);
      testEncoder(encoder);
    });
  });

  context("try to decode a map with non-string keys (asynchronous)", () => {
    it("throws errors", async () => {
      const decoder = new Decoder(uctrl());
      const createStream = async function* () {
        yield [0x81]; // fixmap size=1
        yield encode(null, pctrl());
        yield encode(null, pctrl());
      };

      await assert.rejects(async () => {
        await decoder.decodeAsync(createStream());
      }, /The type of key must be string/i);
      testDecoder(decoder);
    });
  });

  context("try to decode invalid MessagePack binary", () => {
    it("throws errors", () => {
      const decoder = new Decoder(uctrl());
      const TYPE_NEVER_USED = 0xc1;

      assert.throws(() => {
        decoder.decode([TYPE_NEVER_USED]);
      }, /unrecognized type byte/i);
      testDecoder(decoder);
    });
  });

  context("try to decode insufficient data", () => {
    it("throws errors (synchronous)", () => {
      const decoder = new Decoder(uctrl());
      assert.throws(() => {
        decoder.decode([
          0x92, // fixarray size=2
          0xc0, // nil
        ]);
      }, RangeError);
      testDecoder(decoder);
    });

    it("throws errors (asynchronous)", async () => {
      const decoder = new Decoder(uctrl());
      const createStream = async function* () {
        yield [0x92]; // fixarray size=2
        yield encode(null, pctrl());
      };

      await assert.rejects(async () => {
        await decoder.decodeAsync(createStream());
      }, RangeError);
      testDecoder(decoder);
    });
  });

  context("try to decode data with extra bytes", () => {
    it("throws errors (synchronous)", () => {
      const decoder = new Decoder(uctrl());
      assert.throws(() => {
        decoder.decode([
          0x90, 0xC0, // fixarray size=0
          ...encode(null, pctrl()),
        ]);
      }, RangeError);
      testDecoder(decoder);
    });

    it("throws errors (asynchronous)", async () => {
      const decoder = new Decoder(uctrl());
      const createStream = async function* () {
        yield [0x90, 0xC0]; // fixarray size=0
        yield encode(null, pctrl());
      };

      await assert.rejects(async () => {
        await decoder.decodeAsync(createStream());
      }, RangeError);
      testDecoder(decoder);
    });

    it("throws errors (asynchronous)", async () => {
      const decoder = new Decoder(uctrl());
      const createStream = async function* () {
        yield [0x90, 0xC0, ...encode(null, pctrl())]; // fixarray size=0 + nil
      };

      await assert.rejects(async () => {
        await decoder.decodeAsync(createStream());
      }, RangeError);
      testDecoder(decoder);
    });
  });

  context("try to decode an empty input", () => {
    it("throws RangeError (synchronous)", () => {
      assert.throws(() => {
        decode([], uctrl());
      }, RangeError);
    });

    it("decodes an empty array with decodeMulti()", () => {
      assert.deepStrictEqual([...decodeMulti([], uctrl())], []);
    });

    it("throws RangeError (asynchronous)", async () => {
      const createStream = async function* () {
        yield [];
      };

      assert.rejects(async () => {
        await decodeAsync(createStream(), uctrl());
      }, RangeError);
    });

    it("decodes an empty array with decodeMultiStream()", async () => {
      const createStream = async function* () {
        yield [];
      };

      const results: Array<unknown> = [];
      for await (const item of decodeMultiStream(createStream(), uctrl())) {
        results.push(item);
      }
      assert.deepStrictEqual(results, []);
    });
  });
});
