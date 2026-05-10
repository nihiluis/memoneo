import { describe, expect, it, vi } from "vitest"

const digestStringAsync = vi.fn()

vi.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: { MD5: "MD5" },
  CryptoEncoding: { BASE64: "BASE64" },
  digestStringAsync,
}))

describe("md5HashText", () => {
  it("delegates to expo crypto with MD5 and base64 encoding", async () => {
    digestStringAsync.mockResolvedValue("digest")
    const { md5HashText } = await import("./hash")

    await expect(md5HashText("body")).resolves.toBe("digest")
    expect(digestStringAsync).toHaveBeenCalledWith("MD5", "body", {
      encoding: "BASE64",
    })
  })
})
