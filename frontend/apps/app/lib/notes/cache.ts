import AsyncStorage from "@react-native-async-storage/async-storage"

const NOTE_CACHE_KEY = "notes.fileCache"

export type LocalNoteCache = Record<
  string,
  {
    lastMd5Hash: string
    lastSync: string
  }
>

export async function loadNoteCache(): Promise<LocalNoteCache> {
  const text = await AsyncStorage.getItem(NOTE_CACHE_KEY)
  if (!text) {
    return {}
  }

  return JSON.parse(text) as LocalNoteCache
}

export async function saveNoteCache(cache: LocalNoteCache) {
  await AsyncStorage.setItem(NOTE_CACHE_KEY, JSON.stringify(cache))
}
