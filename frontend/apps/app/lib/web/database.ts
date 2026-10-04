const DATABASE_NAME = "memoneo"
export type StoreName = "notes" | "folders" | "recordings"

async function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined")
    throw new Error("Browser storage is unavailable.")
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => {
      for (const name of ["notes", "folders", "recordings"]) {
        request.result.createObjectStore(name, { keyPath: "id" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () =>
      reject(new Error("Close other Memoneo tabs to upgrade storage."))
  })
}

export async function databaseRequest<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const database = await openDatabase()
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(store, mode)
      const request = operation(transaction.objectStore(store))
      transaction.oncomplete = () => resolve(request.result)
      transaction.onerror = () => reject(transaction.error ?? request.error)
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Storage operation aborted."))
    })
  } finally {
    database.close()
  }
}

export function listRecords<T>(store: StoreName): Promise<T[]> {
  return databaseRequest(store, "readonly", store => store.getAll())
}
export function putRecord<T extends { id: string }>(
  store: StoreName,
  value: T
) {
  return databaseRequest(store, "readwrite", store => store.put(value))
}
export function deleteRecord(store: StoreName, id: string) {
  return databaseRequest(store, "readwrite", store => store.delete(id))
}
export function clearRecords(store: StoreName) {
  return databaseRequest(store, "readwrite", store => store.clear())
}
