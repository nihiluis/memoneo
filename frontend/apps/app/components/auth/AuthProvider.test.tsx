import React from "react"
import { Provider, createStore } from "jotai"
import { afterEach, describe, expect, it, vi } from "vitest"
import { testingLibrary } from "../../test/react-native-testing"

const mocks = vi.hoisted(() => ({
  get: vi.fn(), set: vi.fn(), remove: vi.fn(), check: vi.fn(),
  listener: undefined as undefined | ((state: string) => void),
}))
vi.mock("@/lib/auth/tokenStorage", () => ({
  getItemAsync: mocks.get, setItemAsync: mocks.set, deleteItemAsync: mocks.remove,
}))
vi.mock("@/lib/auth/api", () => ({ apiCheckAuth: mocks.check }))
vi.mock("react-native", async () => ({
  ...await import("../../test/mocks/react-native"),
  AppState: { addEventListener: (_: string, listener: (state: string) => void) => {
    mocks.listener = listener
    return { remove: vi.fn() }
  } },
}))
const { authAtom, tokenAtom } = await import("@/lib/auth/state")
const { default: AuthProvider } = await import("./AuthProvider")
const { render, act, cleanup } = testingLibrary

afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers() })

describe("AuthProvider sessions", () => {
  it.each([false, true])("only clears a rejected session (invalid: %s)", async invalidToken => {
    mocks.get.mockResolvedValue("saved-token")
    mocks.check.mockResolvedValue({ success: false, invalidToken })
    const store = createStore()
    render(<Provider store={store}><AuthProvider /></Provider>)
    await act(async () => {})
    expect(store.get(tokenAtom)).toBe(invalidToken ? "" : "saved-token")
    expect(mocks.remove).toHaveBeenCalledTimes(invalidToken ? 1 : 0)
  })

  it("automatically renews an active session", async () => {
    vi.useFakeTimers()
    mocks.get.mockResolvedValue("saved-token")
    mocks.check.mockResolvedValue({ success: true, token: "renewed", userId: "user", mail: "mail" })
    const store = createStore()
    await store.set(tokenAtom, "saved-token")
    store.set(authAtom, { ...store.get(authAtom), isAuthenticated: true })
    render(<Provider store={store}><AuthProvider /></Provider>)
    await act(async () => {})
    expect(mocks.check).not.toHaveBeenCalled()
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000) })
    expect(mocks.check).toHaveBeenCalledWith("saved-token")
    expect(store.get(tokenAtom)).toBe("renewed")
  })

  it("retries and saves a refreshed session on returning to the app", async () => {
    mocks.get.mockResolvedValue("saved-token")
    mocks.check.mockResolvedValueOnce({ success: false, invalidToken: false })
    mocks.check.mockResolvedValueOnce({ success: true, token: "renewed", userId: "user", mail: "mail" })
    const store = createStore()
    render(<Provider store={store}><AuthProvider /></Provider>)
    await act(async () => {})
    await act(async () => { mocks.listener?.("active") })
    expect(store.get(tokenAtom)).toBe("renewed")
    expect(store.get(authAtom).isAuthenticated).toBe(true)
    expect(mocks.set).toHaveBeenCalledWith("auth_token", "renewed")
  })
})
