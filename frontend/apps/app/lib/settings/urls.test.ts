import { beforeEach, describe, expect, it, vi } from "vitest"

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
