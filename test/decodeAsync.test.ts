import assert from "assert";
import { encode, decodeAsync } from "../src/index.ts";
import { pctrl, uctrl } from "./test-utils.ts";

describe("decodeAsync", () => {
  function wrapWithNoisyBuffer(byte: number) {
    return Uint8Array.from([0x01, byte, 0x02]).subarray(1, 2);
  }

  it("decodes nil", async () => {
    const createStream = async function* () {
      yield wrapWithNoisyBuffer(0xc0); // nil
    };

    const object = await decodeAsync(createStream(), uctrl());
    assert.deepStrictEqual(object, null);
  });

  it("decodes fixarray [nil]", async () => {
    const createStream = async function* () {
      yield wrapWithNoisyBuffer(0x91); // fixarray size=1
      yield [0xc0, 0xc0]; // nil
    };

    const object = await decodeAsync(createStream(), uctrl());
    assert.deepStrictEqual(object, [null]);
  });

  it("decodes fixmap {'foo': 'bar'}", async () => {
    const createStream = async function* () {
      yield [0x81, 0xc0]; // fixmap size=1
      yield encode("foo", pctrl());
      yield encode("bar", pctrl());
    };

    const object = await decodeAsync(createStream(), uctrl());
    assert.deepStrictEqual(object, { "foo": "bar" });
  });

  it("decodes fixmap {'[1, 2]': 'baz'} with custom map key converter", async () => {
    const createStream = async function* () {
      yield [0x81, 0xc0]; // fixmap size=1
      yield encode([1, 2], pctrl());
      yield encode("baz", pctrl());
    };

    const object = await decodeAsync(createStream(), uctrl({
      mapKeyConverter: (key) => JSON.stringify(key),
    }));

    const key = JSON.stringify([1, 2]);
    assert.deepStrictEqual(object, { [key]: "baz" });
  });

  it("decodes multi-byte integer byte-by-byte", async () => {
    const createStream = async function* () {
      yield [0xcd]; // uint 16
      yield [0x12];
      yield [0x34];
    };
    const object = await decodeAsync(createStream(), uctrl());
    assert.deepStrictEqual(object, 0x1234);
  });

  it("decodes fixstr byte-by-byte", async () => {
    const createStream = async function* () {
      yield [0xa3]; // fixstr size=3
      yield [0x66]; // "f"
      yield [0x6f]; // "o"
      yield [0x6f]; // "o"
    };
    const object = await decodeAsync(createStream(), uctrl());
    assert.deepStrictEqual(object, "foo");
  });

  it("decodes binary byte-by-byte", async () => {
    const createStream = async function* () {
      yield [0xc4]; // bin 8
      yield [0x03]; // bin size=3
      yield [0x66]; // "f"
      yield [0x6f]; // "o"
      yield [0x6f]; // "o"
    };
    const object = await decodeAsync(createStream(), uctrl());
    assert.deepStrictEqual(object, Uint8Array.from([0x66, 0x6f, 0x6f]));
  });

  it("decodes binary with noisy buffer", async () => {
    const createStream = async function* () {
      yield wrapWithNoisyBuffer(0xc5); // bin 16
      yield [0x00];
      yield [0x00]; // bin size=0
    };
    const object = await decodeAsync(createStream(), uctrl());
    assert.deepStrictEqual(object, new Uint8Array(0));
  });

  it("decodes mixed object byte-by-byte", async () => {
    const object = {
      nil: null,
      true: true,
      false: false,
      int: -42,
      uint64: Number.MAX_SAFE_INTEGER,
      int64: Number.MIN_SAFE_INTEGER,
      float: Math.PI,
      string: "Hello, world!",
      longString: "Hello, world!\n".repeat(100),
      binary: Uint8Array.from([0xf1, 0xf2, 0xf3]),
      array: [1000, 2000, 3000],
      map: { foo: 1, bar: 2, baz: 3 },
      nested: { inner: "value", count: 42},
      map0: {},
      array0: [],
      str0: "",
      bin0: Uint8Array.from([]),
    };

    const createStream = async function* () {
      for (const byte of encode(object, pctrl())) {
        yield [byte];
      }
    };
    assert.deepStrictEqual(await decodeAsync(createStream(), uctrl()), object);
  });

  it("decodes BufferSource", async () => {
    // https://developer.mozilla.org/en-US/docs/Web/API/BufferSource
    const createStream = async function* () {
      yield [0x81, 0xc0] as ArrayLike<number>; // fixmap size=1
      yield encode("foo", pctrl()) as BufferSource;
      yield encode("bar", pctrl()) as BufferSource;
    };

    // createStream() returns AsyncGenerator<ArrayLike<number> | BufferSource, ...>
    const object = await decodeAsync(createStream(), uctrl());
    assert.deepStrictEqual(object, { "foo": "bar" });
  });
});
