import { deepStrictEqual } from "assert";
import { decodeAsync, encode, decodeArrayStream } from "../src/index.ts";
import { pctrl, uctrl } from "./test-utils.ts";

const isReadableStreamConstructorAvailable: boolean = (() => {
  try {
    // Edge <= 18 has ReadableStream but its constructor is not available
    new ReadableStream({
      start(_controller) {},
    });
    return true;
  } catch {
    return false;
  }
})();

// Downgrade stream not to implement AsyncIterable<T>
function downgradeReadableStream(stream: ReadableStream) {
  (stream as any)[Symbol.asyncIterator] = undefined;
}

(isReadableStreamConstructorAvailable ? describe : describe.skip)("whatwg streams", () => {
  it("decodeArrayStream", async () => {
    const data = [1, 2, 3];
    const encoded = encode(data, pctrl());
    const stream = new ReadableStream({
      start(controller) {
        for (const byte of encoded) {
          controller.enqueue([byte]);
        }
        controller.close();
      },
    });
    downgradeReadableStream(stream);

    const items: Array<unknown> = [];
    for await (const item of decodeArrayStream(stream, uctrl())) {
      items.push(item);
    }
    deepStrictEqual(items, data);
  });

  it("decodeAsync", async () => {
    const data = [1, 2, 3];
    const encoded = encode(data, pctrl());
    const stream = new ReadableStream({
      start(controller) {
        for (const byte of encoded) {
          controller.enqueue([byte]);
        }
        controller.close();
      },
    });
    downgradeReadableStream(stream);

    deepStrictEqual(await decodeAsync(stream, uctrl()), data);
  });
});
