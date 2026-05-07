import { API_BASE_URL, AUTH_BASE_URL } from "@/constants/env"

export function getAuthUrl(path: string) {
  return `${AUTH_BASE_URL}${path}`
}

export function getApiUrl(path: string) {
  return `${API_BASE_URL}${path}`
}
