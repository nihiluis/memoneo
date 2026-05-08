import { Command } from "@oclif/core"
import protect from "await-protect"
import * as fs from "fs/promises"

const CACHE_PATH = "./.memoneo/cache.json"

export interface MemoneoFileCache {
  trackedNoteIds: string[]
  notes: Record<string, NoteCacheData>
  getOrCreateNoteCacheData(id: string): NoteCacheData
  updateNoteCacheData(id: string, data: Partial<NoteCacheData>): void
}

export interface NoteCacheData {
  lastSync: string
  lastMd5Hash: string
}

export async function loadFileCache(): Promise<MemoneoFileCache | undefined> {
  const [cacheBuffer, err] = await protect(fs.readFile(CACHE_PATH))
  if (!cacheBuffer) {
    return undefined
  }

  const cache = JSON.parse(cacheBuffer.toString("utf-8"))
  cache.getOrCreateNoteCacheData = (id: string) =>
    getOrCreateNoteCacheData(cache, id)
  cache.updateNoteCacheData = (id: string, data: Partial<NoteCacheData>) =>
    updateNoteCacheData(cache, id, data)

  // TODO validate config

  return cache
}

export async function saveFileCache(
  command: Command,
  cache: MemoneoFileCache,
  options: { logMessage?: boolean } = { logMessage: true }
) {
  if (options.logMessage) {
    command.log("Saving file cache...")
  }
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache))
}

export async function reloadOrCreateFileCache(): Promise<MemoneoFileCache> {
  // todo impl load
  const [_, err] = await protect(fs.access(CACHE_PATH))

  if (err) {
    // assuming file does not exist
    return await createEmptyFileCache()
  }

  const cache = await loadFileCache()
  if (!cache) {
    throw new Error("unable to load cache")
  }

  return cache
}

export async function createEmptyFileCache(): Promise<MemoneoFileCache> {
  const cache: MemoneoFileCache = {
    trackedNoteIds: [],
    notes: {},
    getOrCreateNoteCacheData: (id: string) =>
      getOrCreateNoteCacheData(cache, id),
    updateNoteCacheData: (id: string, data: Partial<NoteCacheData>) =>
      updateNoteCacheData(cache, id, data),
  }

  await fs.writeFile(CACHE_PATH, JSON.stringify(cache))

  return cache
}

function getOrCreateNoteCacheData(
  cache: MemoneoFileCache,
  id: string
): NoteCacheData {
  if (!cache.notes.hasOwnProperty(id)) {
    cache.notes[id] = { lastMd5Hash: "", lastSync: "" }
  }

  return cache.notes[id]
}

function updateNoteCacheData(
  cache: MemoneoFileCache,
  id: string,
  data: Partial<NoteCacheData>
) {
  cache.notes[id] = { ...cache.notes[id], ...data }
}
