import axios from "axios"
import {
  ENDPOINT_AUTH_URL,
  ENDPOINT_LOGIN_URL,
  ENDPOINT_PASSWORD_URL,
  ENDPOINT_SAVE_KEY_URL,
} from "../constants/env.js"
import protect from "await-protect"
import { encryptProtectedKey } from "./key.js"
import { encodeBase64String } from "../shared/base64.js"

export type Enckey = {
  key: string
  salt: string
}

export interface AuthResult {
  success: boolean
  errorMessage: string
  error?: Error
  enckey?: Enckey
  token: string
  userId: string
  mail: string
}

interface ChangePasswordResult {
  success: boolean
  errorMessage: string
  token: string
  error?: Error
}

interface CreateNewKeyResult {
  key?: CryptoKey
  salt?: string
  error: string
}

export async function apiSaveKey(
  token: string,
  password: string,
  key: CryptoKey
): Promise<CreateNewKeyResult> {
  const { ivStr, ctStr } = await encryptProtectedKey(password, key)

  const [_, error] = await protect(
    axios.post(
      ENDPOINT_SAVE_KEY_URL,
      { key: encodeBase64String(ctStr), salt: encodeBase64String(ivStr) },
      {
        headers: getDefaultHeaders(token),
        withCredentials: true,
      }
    )
  )

  if (error) {
    return { error: error.message }
  }

  return {
    error: "",
  }
}

function getDefaultHeaders(token?: string) {
  const headers = {
    "Proxy-Authorization": process.env.PROXY_AUTHORIZATION_HEADER ?? "",
    Authorization: "",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return headers
}

export async function apiCheckAuth(
  existingToken: string = ""
): Promise<AuthResult> {
  const headers = getDefaultHeaders(existingToken)

  const [res, error] = await protect<any, Error>(
    axios.get(ENDPOINT_AUTH_URL, { headers, withCredentials: true })
  )

  if (error || !res.data.hasOwnProperty("token")) {
    return {
      success: false,
      token: "",
      enckey: undefined,
      userId: "",
      errorMessage: error?.message ?? "",
      error,
      mail: "",
    }
  }

  const token: string = res.data.token
  const userId: string = res.data.userId
  const enckey: Enckey = res.data.enckey
  const mail: string = res.data.mail

  return { success: true, token, mail, enckey, userId, errorMessage: "" }
}

export async function apiLogin(
  mail: string,
  password: string
): Promise<AuthResult> {
  const [res, error] = await protect<any, Error>(
    axios.post(
      ENDPOINT_LOGIN_URL,
      { mail, password },
      {
        headers: getDefaultHeaders(),
        withCredentials: true,
      }
    )
  )

  if (error || !res.data.hasOwnProperty("token")) {
    console.log("failed auth")
    return {
      success: false,
      token: "",
      userId: "",
      enckey: undefined,
      errorMessage: error?.message ?? "",
      error,
      mail,
    }
  }

  const token: string = res.data.token
  const userId: string = res.data.userId
  const enckey: Enckey = res.data.enckey

  return { success: true, token, userId, enckey, mail, errorMessage: "" }
}

export async function apiChangePassword(
  token: string,
  newPassword: string
): Promise<ChangePasswordResult> {
  const [res, error] = await protect<any, Error>(
    axios.post(
      ENDPOINT_PASSWORD_URL,
      { password: newPassword },
      {
        headers: getDefaultHeaders(token),
        withCredentials: true,
      }
    )
  )

  if (error || !res.data.hasOwnProperty("token")) {
    return {
      success: false,
      token: "",
      errorMessage: error?.message ?? "",
      error,
    }
  }

  const newToken: string = res.data.token

  return { success: true, token: newToken, errorMessage: "" }
}
