import assert from "assert";
import { encode, decode, decodeAsync } from "../src/index.ts";
import { pctrl, uctrl } from "./test-utils.ts";

(typeof Blob !== "undefined" ? describe : describe.skip)("Blob", () => {
  it("decodes it with `decode()`", async function () {
    const blob = new Blob([encode("Hello!", pctrl())]);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!blob.arrayBuffer) {
      this.skip();
    }
    assert.deepStrictEqual(decode(await blob.arrayBuffer(), uctrl()), "Hello!");
  });

  it("decodes it with `decodeAsync()`", async function () {
    const blob = new Blob([encode("Hello!", pctrl())]);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!blob.stream) {
      this.skip();
    }

    // use any because the type of Blob#stream() in @types/node does not make sense here.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    assert.deepStrictEqual(await decodeAsync(blob.stream() as any, uctrl()), "Hello!");
  });
});
