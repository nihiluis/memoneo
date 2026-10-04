import { Elysia } from "elysia"
import { describe, expect, it } from "vitest"
import { cors } from "./cors.js"
import { ALLOW_ORIGINS } from "./env.js"

const app = new Elysia().use(cors).get("/health", () => ({ status: "ok" }))

describe("browser CORS", () => {
  it("accepts authorized browser preflights for sync requests", async () => {
    const response = await app.handle(new Request("http://localhost/notes", {
      method: "OPTIONS",
      headers: { origin: ALLOW_ORIGINS[0]!, "access-control-request-method": "PUT", "access-control-request-headers": "authorization,content-type" },
    }))
    expect(response.status).toBe(204)
    expect(response.headers.get("access-control-allow-origin")).toBe(ALLOW_ORIGINS[0])
    expect(response.headers.get("access-control-allow-methods")).toContain("PUT")
    expect(response.headers.get("access-control-allow-headers")).toContain("Authorization")
  })

  it("includes CORS headers on actual responses", async () => {
    const response = await app.handle(new Request("http://localhost/health", { headers: { origin: ALLOW_ORIGINS[0]! } }))
    expect(response.headers.get("access-control-allow-origin")).toBe(ALLOW_ORIGINS[0])
    expect(await response.json()).toEqual({ status: "ok" })
  })

  it("does not grant access to unconfigured origins", async () => {
    const response = await app.handle(new Request("http://localhost/health", { headers: { origin: "https://untrusted.invalid" } }))
    expect(response.headers.get("access-control-allow-origin")).toBeNull()
  })
})
