#!/usr/bin/env deno test

/* eslint-disable */
import { deepStrictEqual } from "node:assert";
import { test } from "node:test";
import * as msgpack from "../mod.ts";
import { pctrl, uctrl } from "./test-utils.ts";

test("Hello, world!", () => {
  const encoded = msgpack.encode("Hello, world!", pctrl());
  const decoded = msgpack.decode(encoded, uctrl());
  deepStrictEqual(decoded, "Hello, world!");
});
