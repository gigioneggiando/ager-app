/**
 * RN-safe base64url decoding.
 *
 * The web replicates this with `Buffer.from(part, "base64url")`, but React Native (Hermes)
 * has no Buffer and no guaranteed `atob`/`TextDecoder`. These pure functions decode a
 * base64url string to a UTF-8 JS string using only arithmetic + `String.fromCharCode`, so
 * they run anywhere and are trivially unit-testable.
 */

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// char code → 6-bit value, -1 for anything that isn't a base64 symbol.
const INVERSE: readonly number[] = (() => {
  const table = new Array<number>(128).fill(-1);
  for (let i = 0; i < ALPHABET.length; i++) {
    table[ALPHABET.charCodeAt(i)] = i;
  }
  return table;
})();

function sixBits(code: number): number {
  if (code === 45) return 62; // '-' → '+'
  if (code === 95) return 63; // '_' → '/'
  if (code < 0 || code >= 128) return -1;
  return INVERSE[code] ?? -1;
}

/** Decode a base64url (or base64) string to raw bytes. Ignores padding and stray chars. */
export function base64UrlToBytes(input: string): number[] {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < input.length; i++) {
    const value = sixBits(input.charCodeAt(i));
    if (value < 0) continue; // '=' padding or whitespace
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return bytes;
}

/** Decode UTF-8 bytes to a JS string (handles multi-byte code points + surrogate pairs). */
export function utf8BytesToString(bytes: readonly number[]): string {
  let out = "";
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i++] ?? 0;
    if (b0 < 0x80) {
      out += String.fromCharCode(b0);
    } else if (b0 >= 0xc0 && b0 < 0xe0) {
      const b1 = bytes[i++] ?? 0;
      out += String.fromCharCode(((b0 & 0x1f) << 6) | (b1 & 0x3f));
    } else if (b0 >= 0xe0 && b0 < 0xf0) {
      const b1 = bytes[i++] ?? 0;
      const b2 = bytes[i++] ?? 0;
      out += String.fromCharCode(
        ((b0 & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f),
      );
    } else {
      const b1 = bytes[i++] ?? 0;
      const b2 = bytes[i++] ?? 0;
      const b3 = bytes[i++] ?? 0;
      const codePoint =
        ((b0 & 0x07) << 18) |
        ((b1 & 0x3f) << 12) |
        ((b2 & 0x3f) << 6) |
        (b3 & 0x3f);
      const c = codePoint - 0x10000;
      out += String.fromCharCode(0xd800 + (c >> 10), 0xdc00 + (c & 0x3ff));
    }
  }
  return out;
}

/** Decode a base64url string to a UTF-8 JS string. */
export function base64UrlDecode(input: string): string {
  return utf8BytesToString(base64UrlToBytes(input));
}
