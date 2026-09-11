import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from "tweetnacl-util";

export const b64 = {
  encode: (bytes: Uint8Array): string => encodeBase64(bytes),
  decode: (str: string): Uint8Array => decodeBase64(str),
};

export const utf8 = {
  encode: (text: string): Uint8Array => decodeUTF8(text),
  decode: (bytes: Uint8Array): string => encodeUTF8(bytes),
};
