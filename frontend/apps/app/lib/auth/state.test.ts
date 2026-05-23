import { createStore } from "jotai/vanilla"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { tokenAtom } from "./state"

const secureStore = vi.hoisted(() => ({
  deleteItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
}))

vi.mock("expo-secure-store", () => secureStore)

describe("tokenAtom", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("reads the in-memory token synchronously", () => {
    const store = createStore()

    expect(store.get(tokenAtom)).toBe("")
  })

  it("does not persist the token when the value is unchanged", async () => {
    const store = createStore()

    await store.set(tokenAtom, "token")
    await store.set(tokenAtom, "token")

    expect(secureStore.setItemAsync).toHaveBeenCalledTimes(1)
    expect(store.get(tokenAtom)).toBe("token")
  })
})
