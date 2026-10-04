import { Elysia } from "elysia"
import { ALLOW_ORIGINS } from "./env.js"

export const cors = new Elysia({ name: "browser-cors" }).onRequest(
  ({ request, set }) => {
    const origin = request.headers.get("origin")
    set.headers["vary"] = "Origin"
    if (!origin || !ALLOW_ORIGINS.includes(origin)) return

    set.headers["access-control-allow-origin"] = origin
    set.headers["access-control-allow-methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    set.headers["access-control-allow-headers"] = "Authorization, Content-Type"
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204 })
    }
  }
).as("global")
