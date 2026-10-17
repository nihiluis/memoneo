import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createCipheriv, createHash } from "node:crypto"
import { encodeBase64String } from "../base64"
import {
  browserSessionId,
  deleteBrowserSession,
  readBrowserSession,
  writeBrowserSession,
} from "./browserSession"

const backend = vi.hoisted(() => ({ url: "https://one.test" }))
vi.mock("../settings/urls", () => ({
  getBackendUrls: () => ({ apiUrl: `${backend.url}/api`, authUrl: `${backend.url}/auth` }),
}))
const rawKey = Buffer.from("0123456789abcdef0123456789abcdef")
const iv = Buffer.from("123456789012")
const password = "test password"
const cipher = createCipheriv("aes-256-gcm", createHash("sha256").update(password).digest(), iv)
const protectedKey = Buffer.concat([cipher.update(rawKey), cipher.final(), cipher.getAuthTag()]).toString("base64")
function token(expires = Date.now() / 1000 + 72 * 3600) {
  return `header.${encodeBase64String(JSON.stringify({ exp: expires }))}.signature`
}
async function modules() {
  return {
    storage: await import("./tokenStorage.web"),
    encryption: await import("@/modules/enckey/src/EnckeyModule.web"),
  }
}
async function signIn() {
  const result = await modules()
  await result.encryption.default.createAndStoreKey(password, protectedKey, iv.toString("base64"))
  return result
}

beforeEach(async () => {
  backend.url = "https://two.test"
  await deleteBrowserSession(browserSessionId())
  backend.url = "https://one.test"
  await deleteBrowserSession(browserSessionId())
  vi.resetModules()
})

describe("persistent browser login", () => {
  it("restores both the token and working encryption after a page reload", async () => {
    const { storage, encryption } = await signIn()
    const savedToken = token()
    const ciphertext = await encryption.default.encryptText("my note")
    await storage.setItemAsync("auth_token", savedToken)
    const saved = await readBrowserSession(browserSessionId())
    expect(saved?.key.extractable).toBe(false)
    await expect(crypto.subtle.exportKey("raw", saved!.key)).rejects.toThrow()

    vi.resetModules() // A reload loses every in-memory module variable.
    const reloaded = await modules()
    await expect(reloaded.encryption.default.decryptText(ciphertext)).rejects.toThrow("Sign in")
    expect(await reloaded.storage.getItemAsync("auth_token")).toBe(savedToken)
    await expect(reloaded.encryption.default.decryptText(ciphertext)).resolves.toBe("my note")
  })

  it("persists a refreshed token with the same usable key", async () => {
    const { storage, encryption } = await signIn()
    const ciphertext = await encryption.default.encryptText("secret")
    await storage.setItemAsync("auth_token", token())
    const renewed = token(Date.now() / 1000 + 168 * 3600)
    await storage.setItemAsync("auth_token", renewed)
    vi.resetModules()
    const reloaded = await modules()
    expect(await reloaded.storage.getItemAsync("auth_token")).toBe(renewed)
    expect(await reloaded.encryption.default.decryptText(ciphertext)).toBe("secret")
  })

  it("deletes the token and key on sign-out", async () => {
    const { storage, encryption } = await signIn()
    await storage.setItemAsync("auth_token", token())
    await storage.deleteItemAsync("auth_token")
    expect(await readBrowserSession(browserSessionId())).toBeUndefined()
    await expect(encryption.default.encryptText("secret")).rejects.toThrow("Sign in")
    vi.resetModules()
    expect(await (await modules()).storage.getItemAsync("auth_token")).toBeNull()
  })

  it("removes expired sessions and their keys", async () => {
    const { storage } = await signIn()
    await storage.setItemAsync("auth_token", token(Date.now() / 1000 - 1))
    vi.resetModules()
    const reloaded = await modules()
    expect(await reloaded.storage.getItemAsync("auth_token")).toBeNull()
    expect(await readBrowserSession(browserSessionId())).toBeUndefined()
    await expect(reloaded.encryption.default.encryptText("secret")).rejects.toThrow("Sign in")
  })

  it("does not restore credentials for a different backend", async () => {
    const { storage } = await signIn()
    const saved = token()
    await storage.setItemAsync("auth_token", saved)
    backend.url = "https://two.test"
    vi.resetModules()
    expect(await (await modules()).storage.getItemAsync("auth_token")).toBeNull()
    backend.url = "https://one.test"
    expect(await (await modules()).storage.getItemAsync("auth_token")).toBe(saved)
  })

  it("rejects a session with a missing encryption key", async () => {
    await writeBrowserSession({ id: browserSessionId(), token: token(), key: null as unknown as CryptoKey })
    const { storage } = await modules()
    expect(await storage.getItemAsync("auth_token")).toBeNull()
    expect(await readBrowserSession(browserSessionId())).toBeUndefined()
  })

  it("does not persist a token without an unlocked encryption key", async () => {
    const { storage } = await modules()
    await storage.setItemAsync("auth_token", token())
    expect(await readBrowserSession(browserSessionId())).toBeUndefined()
  })

  it("keeps login usable in memory when browser storage is unavailable", async () => {
    const { storage, encryption } = await signIn()
    vi.stubGlobal("indexedDB", undefined)
    try {
      await storage.setItemAsync("auth_token", token())
      await expect(encryption.default.encryptText("secret")).resolves.toBeTypeOf("string")
      await storage.deleteItemAsync("auth_token")
      await expect(encryption.default.encryptText("secret")).rejects.toThrow("Sign in")
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
