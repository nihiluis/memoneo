import { useAtomValue, useStore } from "jotai"
import { authAtom, getStoredToken, tokenAtom } from "@/lib/auth/state"
import { useEffect, useState } from "react"
import { AppState } from "react-native"
import { apiCheckAuth } from "@/lib/auth/api"
import { shouldRefreshToken } from "@/lib/auth/refresh"

export default function AuthProvider({ children }: { children?: React.ReactNode }) {
  const store = useStore()
  const token = useAtomValue(tokenAtom)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const stored = await getStoredToken()
        if (!cancelled && !store.get(tokenAtom) && stored) {
          await store.set(tokenAtom, stored)
        }
      } finally {
        if (!cancelled) setInitialized(true)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [store])

  useEffect(() => {
    if (!initialized) return
    let cancelled = false
    let pending = false
    async function check() {
      const auth = store.get(authAtom)
      if (cancelled || pending || !token || store.get(tokenAtom) !== token) return
      if (auth.isAuthenticated && !shouldRefreshToken(token)) return
      pending = true
      try {
        const result = await apiCheckAuth(token)
        if (cancelled || store.get(tokenAtom) !== token) return
        if (result.success) {
          store.set(authAtom, {
            isLoading: false,
            isAuthenticated: true,
            user: { id: result.userId, mail: result.mail },
            error: "",
            enckey: result.enckey ?? null,
          })
          await store.set(tokenAtom, result.token)
        } else if (result.invalidToken) {
          store.set(authAtom, {
            isLoading: false,
            isAuthenticated: false,
            user: { id: "", mail: "" },
            error: "Your session has expired. Please sign in again.",
            enckey: null,
          })
          await store.set(tokenAtom, "")
        } else {
          store.set(authAtom, {
            ...auth,
            isLoading: false,
            error: "Could not verify your session. Retrying when connected.",
          })
        }
      } finally {
        pending = false
      }
    }
    if (!store.get(authAtom).isAuthenticated) void check()
    const interval = setInterval(() => { void check() }, 30_000)
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") void check()
    })
    return () => {
      cancelled = true
      clearInterval(interval)
      subscription.remove()
    }
  }, [initialized, store, token])

  return <>{children}</>
}
