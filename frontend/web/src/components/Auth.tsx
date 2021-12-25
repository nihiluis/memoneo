import React, {
  useState,
  useEffect,
  PropsWithChildren,
  useContext,
  useRef,
} from "react"
import { useRouter } from "next/router"
import Head from "next/head"

import { checkAuth, setSessionToken } from "../lib/auth"
import Loading from "./Loading"
import { useKeyStore } from "../stores/key"

interface AuthContextValues {
  auth: AuthState
  setAuth: (state: AuthState) => void
}

export const AuthContext = React.createContext<AuthContextValues>(undefined)

export interface AuthState {
  authenticated: boolean
  error: string
  token: string
  userId: string
}

interface Props {
  require: boolean
  initialToken?: string
}

export default function Auth(props: PropsWithChildren<Props>) {
  const { require, initialToken } = props

  const router = useRouter()

  const { auth, setAuth } = useContext(AuthContext)

  const [authLoading, setAuthLoading] = useState<boolean>(false)
  const [initialized, setInitialized] = useState<boolean>(false)

  const setKeyData = useKeyStore(state => state.set)

  const cancelled = useRef(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.authenticated) {
        console.log(`doing initial auth with token ${initialToken}`)

        setAuthLoading(true)

        const { success, token, enckey, userId, error } = await checkAuth(
          initialToken
        )

        if (enckey) {
          setKeyData({
            protectedKey: window.atob(enckey.key),
            salt: window.atob(enckey.salt),
          })
        }

        if (!cancelled.current) {
          setAuthLoading(false)
          setSessionToken(token)
          setAuth({ authenticated: success, token, userId, error })
        }
      } else if (authLoading) {
        setAuthLoading(false)
      }
    }

    fetchData()

    setInitialized(true)

    return () => {
      cancelled.current = true
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (require && !auth.authenticated && !authLoading && initialized) {
      router.push("/login")
    }

    if (
      auth.authenticated &&
      (router.pathname === "/login" || router.pathname === "/register")
    ) {
      router.push("/")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth])

  return (
    <React.Fragment>
      <Head>{authLoading && <title>Authenticating...</title>}</Head>
      {require && auth.authenticated && !authLoading && props.children}
      {authLoading && <Loading />}
      {!require && !authLoading && props.children}
    </React.Fragment>
  )
}
