export function decodeBase64String(str: string): string {
  return Buffer.from(str, "base64").toString("binary")
}

export function encodeBase64String(str: string): string {
  return Buffer.from(str, "binary").toString("base64")
}
