import { describe, expect, it } from "vitest"
import { encodeBase64String } from "../base64"
import { shouldRefreshToken } from "./refresh"

describe("session refresh", () => {
  const token = `header.${encodeBase64String(JSON.stringify({ iat: 100, exp: 200 }))}.signature`
  it("renews halfway through the issued lifetime", () => {
    expect(shouldRefreshToken(token, 149_000)).toBe(false)
    expect(shouldRefreshToken(token, 150_000)).toBe(true)
    expect(shouldRefreshToken(token, 201_000)).toBe(true)
  })
  it("checks tokens whose lifetime cannot be read", () => {
    expect(shouldRefreshToken("invalid")).toBe(true)
    expect(shouldRefreshToken("header.e30=.signature")).toBe(true)
  })
})
