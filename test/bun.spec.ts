import { expect, test } from "bun:test";
import { encode, decode } from "../src/index.ts";
import { pctrl, uctrl } from "./test-utils.ts";

test("Hello, world!", () => {
  const encoded = encode("Hello, world!", pctrl());
  const decoded = decode(encoded, uctrl());
  expect(decoded).toBe("Hello, world!");
});
