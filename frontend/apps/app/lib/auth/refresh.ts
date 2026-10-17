import { decodeBase64String } from "../base64"

// Refresh halfway through the issued lifetime, leaving time to retry outages.
export function shouldRefreshToken(token: string, now = Date.now()): boolean {
  try {
    const payload = JSON.parse(decodeBase64String(token.split(".")[1]))
    if (typeof payload.iat !== "number" || typeof payload.exp !== "number") {
      return true
    }
    return now >= ((payload.iat + payload.exp) / 2) * 1000
  } catch {
    return true
  }
}
