import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("settings urls", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock("@/constants/env", () => ({
      API_BASE_URL: "https://api.example.test",
      AUTH_BASE_URL: "https://auth.example.test",
    }))
  })

  it("builds auth and api urls from configured base urls", async () => {
    const { getApiUrl, getAuthUrl } = await import("./urls")

    expect(getAuthUrl("/login")).toBe("https://auth.example.test/login")
    expect(getApiUrl("/note")).toBe("https://api.example.test/note")
  })
})

describe("browser backend URLs", () => {
  let values: Map<string, string>
  beforeEach(() => {
    values = new Map()
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it("persists both servers and uses them for subsequent auth and sync requests", async () => {
    const { saveBackendUrls, getApiUrl, getAuthUrl } = await import("./urls")
    saveBackendUrls({ apiUrl: " https://notes.example.test/api/ ", authUrl: "http://localhost:8089/" })
    expect(getApiUrl("/notes")).toBe("https://notes.example.test/api/notes")
    expect(getAuthUrl("/login")).toBe("http://localhost:8089/login")
    vi.resetModules()
    const reloaded = await import("./urls")
    expect(reloaded.getAuthUrl("/auth")).toBe("http://localhost:8089/auth")
  })

  it.each(["", "javascript:alert(1)", "ftp://example.test", "https://user:pass@example.test", "https://example.test?query=1", "https://example.test#fragment"])("rejects invalid base URL %s", async value => {
    const { normalizeBackendUrl } = await import("./urls")
    expect(() => normalizeBackendUrl(value)).toThrow()
  })

  it("falls back to defaults when saved configuration is corrupt", async () => {
    values.set("memoneo.backend-urls", "{invalid")
    const { getApiUrl } = await import("./urls")
    expect(getApiUrl("/notes")).toBe("https://api.example.test/notes")
  })
})
