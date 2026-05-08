import { createRemoteJWKSet, jwtVerify } from "jose"
import { AUTH_JWT_AUDIENCE, AUTH_JWT_ISSUER, JWKS_URL } from "./env.js"

const jwks = createRemoteJWKSet(new URL(JWKS_URL))

export async function verifyAuthorization(authorization?: string) {
  const [scheme, token] = authorization?.split(" ") ?? []
  if (scheme !== "Bearer" || !token) {
    throw new Error("Missing bearer token")
  }

  const { payload } = await jwtVerify(token, jwks, {
    algorithms: ["RS256"],
    issuer: AUTH_JWT_ISSUER,
    audience: AUTH_JWT_AUDIENCE,
  })
  const userId = payload.sub
  if (!userId) {
    throw new Error("Token does not include sub")
  }
  return { token, userId }
}
