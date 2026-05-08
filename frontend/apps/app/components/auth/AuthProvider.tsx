import { useAtom } from "jotai"
import { authAtom, getStoredToken, tokenAtom } from "@/lib/auth/state"
import { useEffect, useState } from "react"
import { apiCheckAuth } from "@/lib/auth/api"
import { useRouter } from "expo-router"
import { useMutation } from "@tanstack/react-query"
import enckey from "@/modules/enckey"

export default function AuthProvider({
  children,
}: {
  children?: React.ReactNode
}) {
  const router = useRouter()
  const [auth, setAuth] = useAtom(authAtom)
  const [token, setToken] = useAtom(tokenAtom)
  const [tokenInitialized, setTokenInitialized] = useState(false)
  const [authInitialized, setAuthInitialized] = useState(false)

  useEffect(() => {
    const loadToken = async () => {
      if (token) {
        // Token is already set from another screen, so we can skip the loading.
        if (auth.isAuthenticated) {
          setAuthInitialized(true)
        }
        return
      }

      const storedToken = await getStoredToken()
      if (storedToken) {
        setToken(storedToken)
      } else {
        setTokenInitialized(true)
      }
    }
    loadToken()
  }, [])

  // Only set this after the storedToken was retrieved.
  useEffect(() => {
    if (!tokenInitialized && token) {
      setTokenInitialized(true)
    }
  }, [token, tokenInitialized])

  const mutation = useMutation({
    mutationFn: (token: string) => apiCheckAuth(token),
    onSuccess: data => {
      setAuth({
        isLoading: false,
        isAuthenticated: data.success,
        user: { id: data.userId, mail: data.mail },
        error: data.errorMessage,
        enckey: data.enckey ?? null,
      })

      setToken(data.token)
      setAuthInitialized(true)
    },
    onError: () => {
      setToken("")
      setAuthInitialized(false)
    },
  })

  useEffect(() => {
    async function checkAuth() {
      if (!tokenInitialized || auth.isAuthenticated) {
        return
      }

      if (token) {
        setAuth({
          isLoading: true,
          isAuthenticated: false,
          user: { id: "", mail: "" },
          error: "",
          enckey: null,
        })
        mutation.mutate(token)
      } else {
        setAuth({
          isLoading: false,
          isAuthenticated: false,
          user: { id: "", mail: "" },
          error: "",
          enckey: null,
        })
        setAuthInitialized(true)
      }
    }
    checkAuth()
  }, [token, tokenInitialized])

  useEffect(() => {
    if (authInitialized && !auth.isAuthenticated) {
      console.log("redirecting to login")
      if (token) {
        setToken("")
      }
      router.replace("/auth/login")
    }
  }, [authInitialized, auth.isAuthenticated])

  return <>{children}</>
}
