import { throws } from "assert";
import { encode, decode, DecodeError } from "../src/index.ts";
import { pctrl, uctrl } from "./test-utils.ts";

describe("prototype pollution", () => {
  context("__proto__ exists as a map key", () => {
    it("raises DecodeError in decoding", () => {
      const o = {
        foo: "bar",
      };
      // override __proto__ as an enumerable property
      Object.defineProperty(o, "__proto__", {
        value: new Date(0),
        enumerable: true,
      });
      const encoded = encode(o, pctrl());

      throws(() => {
        decode(encoded, uctrl());
      }, DecodeError);
    });
  });
});
