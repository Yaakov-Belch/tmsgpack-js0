import type { PackCtrl, UnpackCtrl, EncoderOptions, DecoderOptions } from "../src/index.ts";

export function pctrl(options: Partial<EncoderOptions> = {}): PackCtrl {
  return {
    fromObj(_object: unknown): [boolean, unknown, unknown] {
      throw new Error("fromObj should not be called in plain object tests");
    },
    options,
  };
}

export function uctrl(options: Partial<DecoderOptions> = {}): UnpackCtrl {
  return {
    fromDict(_objectType: unknown, _data: Record<string, unknown>): unknown {
      throw new Error("fromDict should not be called in plain object tests");
    },
    fromList(_objectType: unknown, _data: Array<unknown>): unknown {
      throw new Error("fromList should not be called in plain object tests");
    },
    options,
  };
}
