export const DEV = process.env.NODE_ENV === "development"

export const AUTH_API_URL = process.env.AUTH_API_URL ?? "http://localhost:8089"
export const DATABASE_URL =
  process.env.DATABASE_URL ??
  `postgres://${process.env.DB_USER ?? "postgres"}:${process.env.DB_PASSWORD ?? "postgres"}@${process.env.DB_HOST ?? "localhost"}:${process.env.DB_PORT ?? "5432"}/${process.env.DB_STORE ?? "postgres"}`

export const ENDPOINT_AUTH_URL = `${AUTH_API_URL}/auth`
export const JWKS_URL = `${AUTH_API_URL}/.well-known/jwks.json`

export const PORT = process.env.PORT || 8073

export const VERSION = "0.0.1"
