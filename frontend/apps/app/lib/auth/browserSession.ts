import { getBackendUrls } from "../settings/urls"

export type BrowserSession = {
  id: string
  token: string
  key: CryptoKey
}

// Keep credentials separate from note storage, so clearing notes leaves login intact.
async function request<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  if (typeof indexedDB === "undefined") {
    throw new Error("Browser session storage is unavailable.")
  }
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const open = indexedDB.open("memoneo-session", 1)
    open.onupgradeneeded = () => {
      open.result.createObjectStore("sessions", { keyPath: "id" })
    }
    open.onsuccess = () => resolve(open.result)
    open.onerror = () => reject(open.error)
  })
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction("sessions", mode)
      const result = operation(transaction.objectStore("sessions"))
      transaction.oncomplete = () => resolve(result.result)
      transaction.onerror = () => reject(transaction.error ?? result.error)
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Session storage aborted."))
    })
  } finally {
    database.close()
  }
}

export function browserSessionId() {
  const { apiUrl, authUrl } = getBackendUrls()
  return JSON.stringify([apiUrl, authUrl])
}

export function readBrowserSession(id: string): Promise<BrowserSession | undefined> {
  return request("readonly", store => store.get(id))
}

export function writeBrowserSession(session: BrowserSession) {
  // One transaction stores the token and key together; no partially saved login.
  return request("readwrite", store => store.put(session))
}

export function deleteBrowserSession(id: string) {
  return request("readwrite", store => store.delete(id))
}
