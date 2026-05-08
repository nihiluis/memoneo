import { crypto } from "./reexports.js"

const PROTECTED_KEY_VERSION = "v2"
const PROTECTED_KEY_PREFIX = `${PROTECTED_KEY_VERSION}:`
const PBKDF2_ITERATIONS = 310_000

type ProtectedKeyEnvelope = {
  version: typeof PROTECTED_KEY_VERSION
  kdf: "PBKDF2-SHA256"
  iterations: number
  salt: string
  ciphertext: string
}

export async function getBufferForKey(key: CryptoKey): Promise<Buffer> {
  return Buffer.from(await crypto.subtle.exportKey("raw", key))
}

export async function generateProtectedKey(): Promise<CryptoKey> {
  const protectedKey = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  )

  return protectedKey
}

interface EncryptProtectedKeyResult {
  iv: Uint8Array
  ivStr: string
  ctStr: string
}

export async function encryptProtectedKey(
  password: string,
  protectedKey: CryptoKey
): Promise<EncryptProtectedKeyResult> {
  const exportedKey = await crypto.subtle.exportKey("raw", protectedKey)

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const kdfSalt = crypto.getRandomValues(new Uint8Array(16))
  const alg = { name: "AES-GCM", iv: iv }
  const encryptionKey = await derivePasswordKey(password, kdfSalt, PBKDF2_ITERATIONS)

  const ctBuffer = await crypto.subtle.encrypt(alg, encryptionKey, exportedKey)
  const envelope: ProtectedKeyEnvelope = {
    version: PROTECTED_KEY_VERSION,
    kdf: "PBKDF2-SHA256",
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(kdfSalt),
    ciphertext: bytesToBase64(new Uint8Array(ctBuffer)),
  }
  const ctStr = `${PROTECTED_KEY_PREFIX}${Buffer.from(JSON.stringify(envelope), "utf8").toString("base64")}`
  const ivStr = bytesToBinaryString(iv)

  return { iv, ivStr, ctStr }
}

export async function decryptProtectedKey(
  password: string,
  ctStr: string,
  ivStr: string
): Promise<CryptoKey> {
  const parsed = parseProtectedKey(ctStr)
  const decryptIv = binaryStringToBytes(ivStr)
  const decryptAlg = { name: "AES-GCM", iv: decryptIv }

  const decryptPwKey = parsed.envelope
    ? await derivePasswordKey(
        password,
        base64ToBytes(parsed.envelope.salt),
        parsed.envelope.iterations
      )
    : await deriveLegacyPasswordKey(password)

  const protectedKeyBuffer = await crypto.subtle.decrypt(
    decryptAlg,
    decryptPwKey,
    parsed.ciphertext
  )

  return await crypto.subtle.importKey(
    "raw",
    protectedKeyBuffer,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  )
}

function parseProtectedKey(ctStr: string): {
  envelope?: ProtectedKeyEnvelope
  ciphertext: Uint8Array
} {
  if (!ctStr.startsWith(PROTECTED_KEY_PREFIX)) {
    return { ciphertext: binaryStringToBytes(ctStr) }
  }

  const rawEnvelope = Buffer.from(ctStr.slice(PROTECTED_KEY_PREFIX.length), "base64").toString("utf8")
  const envelope = JSON.parse(rawEnvelope) as ProtectedKeyEnvelope
  if (
    envelope.version !== PROTECTED_KEY_VERSION ||
    envelope.kdf !== "PBKDF2-SHA256" ||
    !Number.isSafeInteger(envelope.iterations) ||
    envelope.iterations < 100_000
  ) {
    throw new Error("Unsupported protected key envelope")
  }

  return { envelope, ciphertext: base64ToBytes(envelope.ciphertext) }
}

async function derivePasswordKey(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  )

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations,
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

async function deriveLegacyPasswordKey(password: string): Promise<CryptoKey> {
  const pwUtf8 = new TextEncoder().encode(password)
  const pwHash = await crypto.subtle.digest("SHA-256", pwUtf8)

  return crypto.subtle.importKey(
    "raw",
    pwHash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  )
}

function bytesToBinaryString(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => String.fromCharCode(b))
    .join("")
}

function binaryStringToBytes(str: string): Uint8Array {
  return new Uint8Array(Array.from(str).map(ch => ch.charCodeAt(0)))
}

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64")
}

function base64ToBytes(str: string): Uint8Array {
  return new Uint8Array(Buffer.from(str, "base64"))
}

interface EncryptTextResult {
  ctStr: string
  ivStr: string
}

export async function encryptText(
  text: string,
  protectedKey: CryptoKey
): Promise<EncryptTextResult> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ivStr = Array.from(iv)
    .map(b => String.fromCharCode(b))
    .join("")
  const alg = { name: "AES-GCM", iv: iv }

  const ctBuffer = await crypto.subtle.encrypt(
    alg,
    protectedKey,
    new TextEncoder().encode(text)
  )

  const ctArray = Array.from(new Uint8Array(ctBuffer))
  const ctStr = ctArray.map(byte => String.fromCharCode(byte)).join("")

  return { ivStr, ctStr }
}

export async function decryptText(
  ctStr: string,
  ivStr: string,
  protectedKey: CryptoKey
): Promise<string> {
  if (!ctStr || !ivStr) {
    throw new Error("Missing required parameters: ciphertext or IV is empty")
  }

  if (ivStr.length !== 12) {
    throw new Error(`IV must be 12 bytes, got ${ivStr.length} bytes`)
  }

  const decryptIv = new Uint8Array(
    Array.from(ivStr).map(ch => ch.charCodeAt(0))
  )
  const decryptAlg = { name: "AES-GCM", iv: decryptIv }

  const ctUint8 = new Uint8Array(Array.from(ctStr).map(ch => ch.charCodeAt(0)))

  try {
    const protectedKeyBuffer = await crypto.subtle.decrypt(
      decryptAlg,
      protectedKey,
      ctUint8
    )

    const plaintext = new TextDecoder().decode(protectedKeyBuffer)

    return plaintext
  } catch (err: unknown) {
    const error = err as Error
    console.error("Failed to decrypt text. Details:", {
      error,
      ivLength: ivStr.length,
      ctLength: ctStr.length,
      keyAlgorithm: protectedKey.algorithm,
      keyUsages: protectedKey.usages,
      errorName: error.name,
      errorMessage: error.message,
      errorCause: (error.cause as Error)?.message
    })
    throw new Error(
      "Failed to decrypt text. This could be due to:\n" +
      "1. Invalid encryption key (most likely cause)\n" +
      "2. Corrupted ciphertext\n" +
      "3. Mismatched IV (initialization vector)\n" +
      "Please ensure you're using the correct encryption key and the data hasn't been corrupted.\n" +
      `Technical details: ${error.name}: ${error.message}`
    )
  }
}
