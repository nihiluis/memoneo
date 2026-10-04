import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("settings urls", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock("@/constants/env", () => ({
      API_BASE_URL: "https://api.example.test",
      AUTH_BASE_URL: "https://auth.example.test",
    }))
  })
  afterEach(() => vi.unstubAllGlobals())

  it("builds auth and api urls from configured base urls", async () => {
    const { getApiUrl, getAuthUrl } = await import("./urls")

    expect(getAuthUrl("/login")).toBe("https://auth.example.test/login")
    expect(getApiUrl("/note")).toBe("https://api.example.test/note")
  })

  it("uses the web origin including its port when no build URLs are configured", async () => {
    vi.doMock("@/constants/env", () => ({ API_BASE_URL: "", AUTH_BASE_URL: undefined }))
    vi.stubGlobal("window", { location: { origin: "https://server.tailnet.ts.net:8443" } })
    const { getApiUrl, getAuthUrl } = await import("./urls")
    expect(getApiUrl("/notes")).toBe("https://server.tailnet.ts.net:8443/api/notes")
    expect(getAuthUrl("/login")).toBe("https://server.tailnet.ts.net:8443/auth/login")
  })

  it("keeps explicit backend URLs when the web app has a different origin", async () => {
    vi.stubGlobal("window", { location: { origin: "https://web.example.test" } })
    const { getBackendUrls } = await import("./urls")
    expect(getBackendUrls()).toEqual({
      apiUrl: "https://api.example.test",
      authUrl: "https://auth.example.test",
    })
  })

  it("leaves unconfigured native backend URLs empty", async () => {
    vi.doMock("@/constants/env", () => ({ API_BASE_URL: undefined, AUTH_BASE_URL: undefined }))
    vi.stubGlobal("window", undefined)
    const { getBackendUrls } = await import("./urls")
    expect(getBackendUrls()).toEqual({ apiUrl: "", authUrl: "" })
  })
})

describe("browser backend URLs", () => {
  let values: Map<string, string>
  beforeEach(() => {
    vi.resetModules()
    vi.doMock("@/constants/env", () => ({
      API_BASE_URL: "https://api.example.test",
      AUTH_BASE_URL: "https://auth.example.test",
    }))
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
