import { atom } from "jotai"
import * as SecureStore from "expo-secure-store"
import { Enckey } from "./api"

interface AuthState {
  isLoading: boolean
  isAuthenticated: boolean
  error: string
  user: {
    id: string
    mail: string
  }
  enckey: Enckey | null
}

const initialAuthState: AuthState = {
  isLoading: false,
  isAuthenticated: false,
  error: "",
  user: {
    id: "",
    mail: "",
  },
  enckey: null,
}

export const TOKEN_STORAGE_KEY = "auth_token"
export async function getStoredToken() {
  return SecureStore.getItemAsync(TOKEN_STORAGE_KEY)
}

export async function clearStoredToken() {
  await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY)
}

// Create the auth atom
export const authAtom = atom<AuthState>(initialAuthState)
const innerTokenAtom = atom<string>("")
export const tokenAtom = atom(
  async get => get(innerTokenAtom),
  async (_get, set, newToken: string) => {
    console.log("Setting token")
    if (newToken) {
      await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, newToken)
    } else {
      await clearStoredToken()
    }

    set(innerTokenAtom, newToken)
  }
)

// Optional: Create derived atoms for specific auth state properties
export const isAuthenticatedAtom = atom(get => get(authAtom).isAuthenticated)
export const userAtom = atom(get => get(authAtom).user)
