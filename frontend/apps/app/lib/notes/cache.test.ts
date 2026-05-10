import { beforeEach, describe, expect, it, vi } from "vitest"

const storage = new Map<string, string>()

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(storage.get(key) ?? null)),
    removeItem: vi.fn((key: string) => {
      storage.delete(key)
      return Promise.resolve()
    }),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value)
      return Promise.resolve()
    }),
  },
}))

describe("note cache", () => {
  beforeEach(() => {
    storage.clear()
  })

  it("loads an empty cache when storage has no value", async () => {
    const { loadNoteCache } = await import("./cache")

    expect(await loadNoteCache()).toEqual({})
  })

  it("saves, loads, and resets note cache data", async () => {
    const { loadNoteCache, resetNoteCache, saveNoteCache } = await import("./cache")
    const cache = {
      "note-1": {
        lastMd5Hash: "hash",
        lastSync: "2026-01-01T00:00:00.000Z",
      },
    }

    await saveNoteCache(cache)
    expect(await loadNoteCache()).toEqual(cache)

    await resetNoteCache()
    expect(await loadNoteCache()).toEqual({})
  })
})
