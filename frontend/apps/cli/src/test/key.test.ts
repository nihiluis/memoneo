import { describe, it, expect } from "vitest"
import {
  decryptProtectedKey,
  decryptText,
  encryptProtectedKey,
  encryptText,
  generateProtectedKey,
} from "../lib/key.js"

describe("Key Tests", () => {
  it("wraps the protected key with a versioned password KDF envelope", async () => {
    const password = "correct horse battery staple"
    const protectedKey = await generateProtectedKey()

    const wrapped = await encryptProtectedKey(password, protectedKey)

    expect(wrapped.ctStr.startsWith("v2:")).toBe(true)

    const unwrappedKey = await decryptProtectedKey(
      password,
      wrapped.ctStr,
      wrapped.ivStr
    )
    const encrypted = await encryptText("test", unwrappedKey)
    const decryptedText = await decryptText(
      encrypted.ctStr,
      encrypted.ivStr,
      unwrappedKey
    )

    expect(decryptedText).toBe("test")
  })
})
