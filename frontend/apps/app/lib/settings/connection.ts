import axios from "axios"
import { normalizeBackendUrl, type BackendUrls } from "./urls"

export async function checkBackendConnection(urls: BackendUrls) {
  const apiUrl = normalizeBackendUrl(urls.apiUrl)
  const authUrl = normalizeBackendUrl(urls.authUrl)
  const [api, auth] = await Promise.all([
    axios.get(`${apiUrl}/health`, { timeout: 5000 }),
    axios.get(`${authUrl}/.well-known/jwks.json`, { timeout: 5000 }),
  ])
  if (api.data?.status !== "ok" || !Array.isArray(auth.data?.keys) || !auth.data.keys.length) {
    throw new Error("These URLs did not return a healthy Memoneo API and authentication service.")
  }
}
