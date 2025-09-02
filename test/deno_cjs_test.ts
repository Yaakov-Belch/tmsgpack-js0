#!/usr/bin/env deno test --allow-read

/* eslint-disable */
import { deepStrictEqual } from "node:assert";
import { test } from "node:test";
import * as msgpack from "../dist.cjs/index.cjs";
import { pctrl, uctrl } from "./test-utils.ts";

test("Hello, world!", () => {
  const encoded = msgpack.encode("Hello, world!", pctrl());
  const decoded = msgpack.decode(encoded, uctrl());
  deepStrictEqual(decoded, "Hello, world!");
});
