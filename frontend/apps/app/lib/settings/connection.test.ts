import axios from "axios"
import { describe, expect, it, vi } from "vitest"
import { checkBackendConnection } from "./connection"

vi.mock("axios", () => ({ default: { get: vi.fn() } }))
const urls = { apiUrl: "https://notes.test/", authUrl: "https://auth.test/" }

describe("backend connection check", () => {
  it("checks both services without requiring a session", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { status: "ok" } }).mockResolvedValueOnce({ data: { keys: [{ kid: "key" }] } })
    await checkBackendConnection(urls)
    expect(axios.get).toHaveBeenCalledWith("https://notes.test/health", { timeout: 5000 })
    expect(axios.get).toHaveBeenCalledWith("https://auth.test/.well-known/jwks.json", { timeout: 5000 })
  })
  it("rejects a reachable server that is not the expected backend", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: "a webpage" })
    await expect(checkBackendConnection(urls)).rejects.toThrow("healthy Memoneo")
  })
  it("reports a network failure", async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error("Network Error"))
    await expect(checkBackendConnection(urls)).rejects.toThrow("Network Error")
  })
})
