const encoder = new TextEncoder()
const decoder = new TextDecoder()
let key: CryptoKey | null = null

function decode(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value.replace(/\s/g, "")), character =>
    character.charCodeAt(0)
  )
}
function encode(value: Uint8Array): string {
  return btoa(Array.from(value, byte => String.fromCharCode(byte)).join(""))
}
function unlockedKey() {
  if (!key)
    throw new Error("Sign in to unlock encryption before syncing notes.")
  return key
}

export default {
  ok: () => "web",
  clearKey: () => {
    key = null
  },
  async createAndStoreKey(password: string, ciphertext: string, iv: string) {
    key = null
    let passwordKey: CryptoKey
    let encrypted: Uint8Array<ArrayBuffer>
    if (ciphertext.startsWith("v2:")) {
      const envelope = JSON.parse(decoder.decode(decode(ciphertext.slice(3))))
      if (
        envelope.version !== "v2" ||
        envelope.kdf !== "PBKDF2-SHA256" ||
        !Number.isInteger(envelope.iterations) ||
        envelope.iterations < 100_000
      ) {
        throw new Error("Unsupported protected key envelope")
      }
      const material = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
      )
      passwordKey = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          hash: "SHA-256",
          salt: decode(envelope.salt),
          iterations: envelope.iterations,
        },
        material,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      )
      encrypted = decode(envelope.ciphertext)
    } else {
      const digest = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(password)
      )
      passwordKey = await crypto.subtle.importKey(
        "raw",
        digest,
        "AES-GCM",
        false,
        ["decrypt"]
      )
      encrypted = decode(ciphertext)
    }
    const raw = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: decode(iv), tagLength: 128 },
      passwordKey,
      encrypted
    )
    key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
      "encrypt",
      "decrypt",
    ])
  },
  async encryptText(text: string) {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv, tagLength: 128 },
        unlockedKey(),
        encoder.encode(text)
      )
    )
    const combined = new Uint8Array(iv.length + encrypted.length)
    combined.set(iv)
    combined.set(encrypted, iv.length)
    return encode(combined)
  },
  async decryptText(text: string, ivString?: string | null) {
    const combined = decode(text)
    const iv = ivString ? decode(ivString) : combined.slice(0, 12)
    const encrypted = ivString ? combined : combined.slice(12)
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, tagLength: 128 },
      unlockedKey(),
      encrypted
    )
    return decoder.decode(decrypted)
  },
}
