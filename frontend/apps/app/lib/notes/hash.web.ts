import { md5 } from "@noble/hashes/legacy.js"

// This hash detects local edits and must match Android's existing sync cache.
export async function md5HashText(text: string) {
  const digest = md5(new TextEncoder().encode(text))
  return btoa(Array.from(digest, byte => String.fromCharCode(byte)).join(""))
}
