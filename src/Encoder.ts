import { utf8Count, utf8Encode } from "./utils/utf8.ts";
import { setInt64, setUint64 } from "./utils/int.ts";
import { ensureUint8Array } from "./utils/typedArrays.ts";

export const DEFAULT_MAX_DEPTH = 100;
export const DEFAULT_INITIAL_BUFFER_SIZE = 2048;

export type EncoderOptions = Partial<
  Readonly<{
    /**
     * Encodes bigint as Int64 or Uint64 if it's set to true.
     * {@link forceIntegerToFloat} does not affect bigint.
     * Depends on ES2020's {@link DataView#setBigInt64} and
     * {@link DataView#setBigUint64}.
     *
     * Defaults to false.
     */
    useBigInt64: boolean;

    /**
     * The maximum depth in nested objects and arrays.
     *
     * Defaults to 100.
     */
    maxDepth: number;

    /**
     * The initial size of the internal buffer.
     *
     * Defaults to 2048.
     */
    initialBufferSize: number;

    /**
     * If `true`, the keys of an object is sorted. In other words, the encoded
     * binary is canonical and thus comparable to another encoded binary.
     *
     * Defaults to `false`. If enabled, it spends more time in encoding objects.
     */
    sortKeys: boolean;
    /**
     * If `true`, non-integer numbers are encoded in float32, not in float64 (the default).
     *
     * Only use it if precisions don't matter.
     *
     * Defaults to `false`.
     */
    forceFloat32: boolean;

    /**
     * If `true`, an object property with `undefined` value are ignored.
     * e.g. `{ foo: undefined }` will be encoded as `{}`, as `JSON.stringify()` does.
     *
     * Defaults to `false`. If enabled, it spends more time in encoding objects.
     */
    ignoreUndefined: boolean;

    /**
     * If `true`, integer numbers are encoded as floating point numbers,
     * with the `forceFloat32` option taken into account.
     *
     * Defaults to `false`.
     */
    forceIntegerToFloat: boolean;
  }>
>;

export class Encoder {
  private readonly pack_ctrl: PackCtrl;
  private readonly useBigInt64: boolean;
  private readonly maxDepth: number;
  private readonly initialBufferSize: number;
  private readonly sortKeys: boolean;
  private readonly forceFloat32: boolean;
  private readonly ignoreUndefined: boolean;
  private readonly forceIntegerToFloat: boolean;

  private pos: number;
  private view: DataView;
  private bytes: Uint8Array;

  private entered = false;

  public constructor(pack_ctrl: PackCtrl) {
    const options = pack_ctrl.options;
    this.pack_ctrl = pack_ctrl;
    this.useBigInt64 = options?.useBigInt64 ?? false;
    this.maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH;
    this.initialBufferSize = options?.initialBufferSize ?? DEFAULT_INITIAL_BUFFER_SIZE;
    this.sortKeys = options?.sortKeys ?? false;
    this.forceFloat32 = options?.forceFloat32 ?? false;
    this.ignoreUndefined = options?.ignoreUndefined ?? false;
    this.forceIntegerToFloat = options?.forceIntegerToFloat ?? false;

    this.pos = 0;
    this.view = new DataView(new ArrayBuffer(this.initialBufferSize));
    this.bytes = new Uint8Array(this.view.buffer);
  }

  private clone() {
    return new Encoder(this.pack_ctrl);
  }

  private reinitializeState() {
    this.pos = 0;
  }

  /**
   * This is almost equivalent to {@link Encoder#encode}, but it returns an reference of the encoder's internal buffer and thus much faster than {@link Encoder#encode}.
   *
   * @returns Encodes the object and returns a shared reference the encoder's internal buffer.
   */
  public encodeSharedRef(object: unknown): Uint8Array {
    if (this.entered) {
      const instance = this.clone();
      return instance.encodeSharedRef(object);
    }

    try {
      this.entered = true;

      this.reinitializeState();
      this.doEncode(object, 1);
      return this.bytes.subarray(0, this.pos);
    } finally {
      this.entered = false;
    }
  }

  /**
   * @returns Encodes the object and returns a copy of the encoder's internal buffer.
   */
  public encode(object: unknown): Uint8Array {
    if (this.entered) {
      const instance = this.clone();
      return instance.encode(object);
    }

    try {
      this.entered = true;

      this.reinitializeState();
      this.doEncode(object, 1);
      return this.bytes.slice(0, this.pos);
    } finally {
      this.entered = false;
    }
  }

  private doEncode(object: unknown, depth: number): void {
    if (depth > this.maxDepth) {
      throw new Error(`Too deep objects in depth ${depth}`);
    }

    if (object == null) {
      this.encodeNil();
    } else if (typeof object === "boolean") {
      this.encodeBoolean(object);
    } else if (typeof object === "number") {
      if (!this.forceIntegerToFloat) {
        this.encodeNumber(object);
      } else {
        this.encodeNumberAsFloat(object);
      }
    } else if (typeof object === "string") {
      this.encodeString(object);
    } else if (this.useBigInt64 && typeof object === "bigint") {
      this.encodeBigInt64(object);
    } else {
      this.encodeObject(object, depth);
    }
  }

  private ensureBufferSizeToWrite(sizeToWrite: number) {
    const requiredSize = this.pos + sizeToWrite;

    if (this.view.byteLength < requiredSize) {
      this.resizeBuffer(requiredSize * 2);
    }
  }

  private resizeBuffer(newSize: number) {
    const newBuffer = new ArrayBuffer(newSize);
    const newBytes = new Uint8Array(newBuffer);
    const newView = new DataView(newBuffer);

    newBytes.set(this.bytes);

    this.view = newView;
    this.bytes = newBytes;
  }

  private encodeNil() {
    this.writeU8(0xc0);
  }

  private encodeBoolean(object: boolean) {
    if (object === false) {
      this.writeU8(0xc2);
    } else {
      this.writeU8(0xc3);
    }
  }

  private encodeNumber(object: number): void {
    if (!this.forceIntegerToFloat && Number.isSafeInteger(object)) {
      if (object >= 0) {
        if (object < 0x80) {
          // positive fixint
          this.writeU8(object);
        } else if (object < 0x100) {
          // uint 8
          this.writeU8(0xcc);
          this.writeU8(object);
        } else if (object < 0x10000) {
          // uint 16
          this.writeU8(0xcd);
          this.writeU16(object);
        } else if (object < 0x100000000) {
          // uint 32
          this.writeU8(0xce);
          this.writeU32(object);
        } else if (!this.useBigInt64) {
          // uint 64
          this.writeU8(0xcf);
          this.writeU64(object);
        } else {
          this.encodeNumberAsFloat(object);
        }
      } else {
        if (object >= -0x20) {
          // negative fixint
          this.writeU8(0xe0 | (object + 0x20));
        } else if (object >= -0x80) {
          // int 8
          this.writeU8(0xd0);
          this.writeI8(object);
        } else if (object >= -0x8000) {
          // int 16
          this.writeU8(0xd1);
          this.writeI16(object);
        } else if (object >= -0x80000000) {
          // int 32
          this.writeU8(0xd2);
          this.writeI32(object);
        } else if (!this.useBigInt64) {
          // int 64
          this.writeU8(0xd3);
          this.writeI64(object);
        } else {
          this.encodeNumberAsFloat(object);
        }
      }
    } else {
      this.encodeNumberAsFloat(object);
    }
  }

  private encodeNumberAsFloat(object: number): void {
    if (this.forceFloat32) {
      // float 32
      this.writeU8(0xca);
      this.writeF32(object);
    } else {
      // float 64
      this.writeU8(0xcb);
      this.writeF64(object);
    }
  }

  private encodeBigInt64(object: bigint): void {
    if (object >= BigInt(0)) {
      // uint 64
      this.writeU8(0xcf);
      this.writeBigUint64(object);
    } else {
      // int 64
      this.writeU8(0xd3);
      this.writeBigInt64(object);
    }
  }

  private writeStringHeader(byteLength: number) {
    if (byteLength < 32) {
      // fixstr
      this.writeU8(0xa0 + byteLength);
    } else if (byteLength < 0x100) {
      // str 8
      this.writeU8(0xd9);
      this.writeU8(byteLength);
    } else if (byteLength < 0x10000) {
      // str 16
      this.writeU8(0xda);
      this.writeU16(byteLength);
    } else if (byteLength < 0x100000000) {
      // str 32
      this.writeU8(0xdb);
      this.writeU32(byteLength);
    } else {
      throw new Error(`Too long string: ${byteLength} bytes in UTF-8`);
    }
  }

  private encodeString(object: string) {
    const maxHeaderSize = 1 + 4;

    const byteLength = utf8Count(object);
    this.ensureBufferSizeToWrite(maxHeaderSize + byteLength);
    this.writeStringHeader(byteLength);
    utf8Encode(object, this.bytes, this.pos);
    this.pos += byteLength;
  }

  private encodeObject(object: unknown, depth: number) {
    if (Array.isArray(object)) {
      this.encodeArray(object, null, depth);
    } else if (ArrayBuffer.isView(object)) {
      this.encodeBinary(object);
    } else if (this.isPlainMap(object)) {
      this.encodeMap(object as Record<string, unknown>, null, depth);
    } else {
      const [as_dict, object_type, data] = this.pack_ctrl.from_obj(object);
      if (as_dict) {
        this.encodeMap(data as Record<string, unknown>, object_type, depth);
      } else {
        this.encodeArray(data, object_type, depth);
      }
    }
  }

  private isPlainMap(object: unknown) {
    const proto = Object.getPrototypeOf(object);
    return proto === Object.prototype || proto === null;
  }

  private encodeBinary(object: ArrayBufferView) {
    const size = object.byteLength;
    if (size < 0x100) {
      // bin 8
      this.writeU8(0xc4);
      this.writeU8(size);
    } else if (size < 0x10000) {
      // bin 16
      this.writeU8(0xc5);
      this.writeU16(size);
    } else if (size < 0x100000000) {
      // bin 32
      this.writeU8(0xc6);
      this.writeU32(size);
    } else {
      throw new Error(`Too large binary: ${size}`);
    }
    const bytes = ensureUint8Array(object);
    this.writeU8a(bytes);
  }

  private encodeArray(object: Array<unknown>, object_type: unknown, depth: number) {
    const size = object.length;
    if (size < 16) {
      // fixarray
      this.writeU8(0x90 + size);
    } else if (size < 0x10000) {
      // array 16
      this.writeU8(0xdc);
      this.writeU16(size);
    } else if (size < 0x100000000) {
      // array 32
      this.writeU8(0xdd);
      this.writeU32(size);
    } else {
      throw new Error(`Too large array: ${size}`);
    }
    this.doEncode(object_type, depth + 1);
    for (const item of object) {
      this.doEncode(item, depth + 1);
    }
  }

  private countWithoutUndefined(object: Record<string, unknown>, keys: ReadonlyArray<string>): number {
    let count = 0;

    for (const key of keys) {
      if (object[key] !== undefined) {
        count++;
      }
    }

    return count;
  }

  private encodeMap(object: Record<string, unknown>, object_type: unknown, depth: number) {
    const keys = Object.keys(object);
    if (this.sortKeys) {
      keys.sort();
    }

    const size = this.ignoreUndefined ? this.countWithoutUndefined(object, keys) : keys.length;

    if (size < 16) {
      // fixmap
      this.writeU8(0x80 + size);
    } else if (size < 0x10000) {
      // map 16
      this.writeU8(0xde);
      this.writeU16(size);
    } else if (size < 0x100000000) {
      // map 32
      this.writeU8(0xdf);
      this.writeU32(size);
    } else {
      throw new Error(`Too large map object: ${size}`);
    }

    this.doEncode(object_type, depth + 1);

    for (const key of keys) {
      const value = object[key];

      if (!(this.ignoreUndefined && value === undefined)) {
        this.encodeString(key);
        this.doEncode(value, depth + 1);
      }
    }
  }

  private writeU8(value: number) {
    this.ensureBufferSizeToWrite(1);

    this.view.setUint8(this.pos, value);
    this.pos++;
  }

  private writeU8a(values: ArrayLike<number>) {
    const size = values.length;
    this.ensureBufferSizeToWrite(size);

    this.bytes.set(values, this.pos);
    this.pos += size;
  }

  private writeI8(value: number) {
    this.ensureBufferSizeToWrite(1);

    this.view.setInt8(this.pos, value);
    this.pos++;
  }

  private writeU16(value: number) {
    this.ensureBufferSizeToWrite(2);

    this.view.setUint16(this.pos, value);
    this.pos += 2;
  }

  private writeI16(value: number) {
    this.ensureBufferSizeToWrite(2);

    this.view.setInt16(this.pos, value);
    this.pos += 2;
  }

  private writeU32(value: number) {
    this.ensureBufferSizeToWrite(4);

    this.view.setUint32(this.pos, value);
    this.pos += 4;
  }

  private writeI32(value: number) {
    this.ensureBufferSizeToWrite(4);

    this.view.setInt32(this.pos, value);
    this.pos += 4;
  }

  private writeF32(value: number) {
    this.ensureBufferSizeToWrite(4);

    this.view.setFloat32(this.pos, value);
    this.pos += 4;
  }

  private writeF64(value: number) {
    this.ensureBufferSizeToWrite(8);

    this.view.setFloat64(this.pos, value);
    this.pos += 8;
  }

  private writeU64(value: number) {
    this.ensureBufferSizeToWrite(8);

    setUint64(this.view, this.pos, value);
    this.pos += 8;
  }

  private writeI64(value: number) {
    this.ensureBufferSizeToWrite(8);

    setInt64(this.view, this.pos, value);
    this.pos += 8;
  }

  private writeBigUint64(value: bigint) {
    this.ensureBufferSizeToWrite(8);

    this.view.setBigUint64(this.pos, value);
    this.pos += 8;
  }

  private writeBigInt64(value: bigint) {
    this.ensureBufferSizeToWrite(8);

    this.view.setBigInt64(this.pos, value);
    this.pos += 8;
  }
}
