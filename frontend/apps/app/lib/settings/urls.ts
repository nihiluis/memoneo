import { API_BASE_URL, AUTH_BASE_URL } from "@/constants/env"

export type BackendUrls = { apiUrl: string; authUrl: string }
const STORAGE_KEY = "memoneo.backend-urls"

export function normalizeBackendUrl(value: string) {
  const url = new URL(value.trim())
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username || url.password || url.search || url.hash
  ) {
    throw new Error(
      "Enter an HTTP or HTTPS base URL without credentials, a query, or a fragment."
    )
  }
  return url.toString().replace(/\/+$/, "")
}

export function getBackendUrls(): BackendUrls {
  const defaults = { apiUrl: API_BASE_URL ?? "", authUrl: AUTH_BASE_URL ?? "" }
  try {
    if (typeof window === "undefined" || !window.localStorage) return defaults
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return defaults
    const urls = JSON.parse(stored) as BackendUrls
    return {
      apiUrl: normalizeBackendUrl(urls.apiUrl),
      authUrl: normalizeBackendUrl(urls.authUrl),
    }
  } catch {
    return defaults
  }
}

export function saveBackendUrls(urls: BackendUrls) {
  const normalized = {
    apiUrl: normalizeBackendUrl(urls.apiUrl),
    authUrl: normalizeBackendUrl(urls.authUrl),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export function getAuthUrl(path: string) {
  return `${getBackendUrls().authUrl.replace(/\/+$/, "")}${path}`
}

export function getApiUrl(path: string) {
  return `${getBackendUrls().apiUrl.replace(/\/+$/, "")}${path}`
}
