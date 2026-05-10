import { describe, expect, it } from "vitest"

import { decodeBase64String, encodeBase64String } from "./base64"

describe("base64 helpers", () => {
  it("encodes and decodes binary strings", () => {
    const value = "hello memoneo"

    expect(encodeBase64String(value)).toBe("aGVsbG8gbWVtb25lbw==")
    expect(decodeBase64String("aGVsbG8gbWVtb25lbw==")).toBe(value)
  })
})
