import {
  createCipheriv,
  createDecipheriv,
  createHash,
  pbkdf2Sync,
} from "node:crypto"
import { beforeEach, describe, expect, it } from "vitest"
import enckey from "./EnckeyModule.web"

const password = "pässword 🔐"
const rawKey = Buffer.from("0123456789abcdef0123456789abcdef")
const iv = Buffer.from("123456789012")
function encryptBytes(key: Buffer, bytes: Buffer) {
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  return Buffer.concat([
    cipher.update(bytes),
    cipher.final(),
    cipher.getAuthTag(),
  ])
}
function protectedKey(version: "legacy" | "v2") {
  const salt = Buffer.from("0123456789abcdef")
  const derived =
    version === "legacy"
      ? createHash("sha256").update(password).digest()
      : pbkdf2Sync(password, salt, 310_000, 32, "sha256")
  const ciphertext = encryptBytes(derived, rawKey).toString("base64")
  return version === "legacy"
    ? ciphertext
    : `v2:${Buffer.from(
        JSON.stringify({
          version: "v2",
          kdf: "PBKDF2-SHA256",
          iterations: 310_000,
          salt: salt.toString("base64"),
          ciphertext,
        })
      ).toString("base64")}`
}

describe("browser encryption compatibility", () => {
  beforeEach(() => enckey.clearKey())
  it.each(["legacy", "v2"] as const)(
    "unlocks %s keys and decrypts native AES-GCM notes",
    async version => {
      await enckey.createAndStoreKey(
        password,
        protectedKey(version),
        iv.toString("base64")
      )
      const ciphertext = encryptBytes(
        rawKey,
        Buffer.from("Hello 👋\n**markdown**")
      )
      await expect(
        enckey.decryptText(ciphertext.toString("base64"), iv.toString("base64"))
      ).resolves.toBe("Hello 👋\n**markdown**")
      await expect(
        enckey.decryptText(Buffer.concat([iv, ciphertext]).toString("base64"))
      ).resolves.toBe("Hello 👋\n**markdown**")
    }
  )
  it("encrypts notes in the native IV + ciphertext + authentication tag format", async () => {
    await enckey.createAndStoreKey(
      password,
      protectedKey("v2"),
      iv.toString("base64")
    )
    const encrypted = await enckey.encryptText("Web → Android/CLI")
    expect(encrypted.substring(0, 16)).toHaveLength(16)
    const bytes = Buffer.from(encrypted, "base64")
    const decipher = createDecipheriv(
      "aes-256-gcm",
      rawKey,
      bytes.subarray(0, 12)
    )
    decipher.setAuthTag(bytes.subarray(-16))
    expect(
      Buffer.concat([
        decipher.update(bytes.subarray(12, -16)),
        decipher.final(),
      ]).toString()
    ).toBe("Web → Android/CLI")
    expect(await enckey.encryptText("Web → Android/CLI")).not.toBe(encrypted)
  })
  it("rejects tampering and clears the unlocked key after a failed login", async () => {
    await enckey.createAndStoreKey(
      password,
      protectedKey("legacy"),
      iv.toString("base64")
    )
    const encrypted = Buffer.from(await enckey.encryptText("secret"), "base64")
    encrypted[12] ^= 1
    await expect(
      enckey.decryptText(encrypted.toString("base64"))
    ).rejects.toThrow()
    await expect(
      enckey.createAndStoreKey(
        "wrong password",
        protectedKey("v2"),
        iv.toString("base64")
      )
    ).rejects.toThrow()
    await expect(enckey.encryptText("secret")).rejects.toThrow("Sign in")
  })
  it("locks encryption on sign-out", async () => {
    await enckey.createAndStoreKey(
      password,
      protectedKey("legacy"),
      iv.toString("base64")
    )
    enckey.clearKey()
    await expect(enckey.encryptText("secret")).rejects.toThrow("Sign in")
  })
  it("rejects unsupported key envelopes", async () => {
    const envelope = `v2:${Buffer.from(
      JSON.stringify({ version: "v2", kdf: "PBKDF2-SHA256", iterations: 1 })
    ).toString("base64")}`
    await expect(
      enckey.createAndStoreKey(password, envelope, iv.toString("base64"))
    ).rejects.toThrow("Unsupported")
  })
})
