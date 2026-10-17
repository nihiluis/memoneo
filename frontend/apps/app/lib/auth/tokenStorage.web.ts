import {
  clearUnlockedKey,
  getUnlockedKey,
  restoreUnlockedKey,
} from "@/modules/enckey/src/EnckeyModule.web"
import {
  browserSessionId,
  deleteBrowserSession,
  readBrowserSession,
  writeBrowserSession,
} from "./browserSession"
import { decodeBase64String } from "../base64"

export async function getItemAsync(_name: string) {
  const id = browserSessionId()
  try {
    const session = await readBrowserSession(id)
    if (!session) return null
    const { exp } = JSON.parse(decodeBase64String(session.token.split(".")[1]))
    if (typeof exp !== "number" || !Number.isFinite(exp) || exp * 1000 <= Date.now()) {
      await deleteItemAsync(_name)
      return null
    }
    restoreUnlockedKey(session.key)
    return session.token
  } catch {
    // Storage can be unavailable in private browsing, or a record can be invalid.
    clearUnlockedKey()
    await deleteBrowserSession(id).catch(() => {})
    return null
  }
}

export async function setItemAsync(_name: string, token: string) {
  const id = browserSessionId()
  const key = getUnlockedKey()
  // A token without its unlocked key cannot restore a usable login.
  if (!key) {
    await deleteBrowserSession(id).catch(() => {})
    return
  }
  try {
    await writeBrowserSession({ id, token, key })
  } catch {
    // Allow an in-memory session when browser storage is disabled/full.
    await deleteBrowserSession(id).catch(() => {})
  }
}

export async function deleteItemAsync(_name: string) {
  clearUnlockedKey()
  if (typeof indexedDB !== "undefined") {
    await deleteBrowserSession(browserSessionId())
  }
}
