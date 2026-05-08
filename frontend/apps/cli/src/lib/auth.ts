import { createAuthApiClient } from "@memoneo/shared"
import { AUTH_API_URL } from "../constants/env.js"
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

interface RegisterResult {
  success: boolean
  errorMessage: string
  token: string
  userId: string
  mail: string
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
  const client = createAuthClient()

  const result = await client.saveKey(
    token,
    ctStr.startsWith("v2:") ? ctStr : encodeBase64String(ctStr),
    encodeBase64String(ivStr)
  )

  if (result.error) {
    return { error: result.error.message }
  }

  return {
    error: "",
  }
}

function createAuthClient(token?: string) {
  return createAuthApiClient(
    AUTH_API_URL,
    token,
    process.env.PROXY_AUTHORIZATION_HEADER ?? ""
  )
}

function getAuthFailure(error: Error | undefined, mail: string = ""): AuthResult {
  return {
    success: false,
    token: "",
    enckey: undefined,
    userId: "",
    errorMessage: error?.message ?? "",
    error,
    mail,
  }
}

function getRegisterFailure(
  error: Error | undefined,
  mail: string = ""
): RegisterResult {
  return {
    success: false,
    token: "",
    userId: "",
    errorMessage: error?.message ?? "",
    error,
    mail,
  }
}

export async function apiCheckAuth(
  existingToken: string = ""
): Promise<AuthResult> {
  const client = createAuthClient(existingToken)
  const [result, error] = await protect(client.checkAuth(existingToken))

  if (error || result?.error || !result?.data?.token) {
    return getAuthFailure(error ?? result?.error)
  }

  const { token, userId, enckey, mail } = result.data

  return {
    success: true,
    token,
    mail,
    enckey: enckey
      ? {
          key: enckey.key,
          salt: enckey.salt,
        }
      : undefined,
    userId,
    errorMessage: "",
  }
}

export async function apiLogin(
  mail: string,
  password: string
): Promise<AuthResult> {
  const client = createAuthClient()
  const [result, error] = await protect(client.login(mail, password))

  if (error || result?.error || !result?.data?.token) {
    console.log("failed auth")
    return getAuthFailure(error ?? result?.error, mail)
  }

  const { token, userId, enckey } = result.data

  return {
    success: true,
    token,
    userId,
    enckey: enckey
      ? {
          key: enckey.key,
          salt: enckey.salt,
        }
      : undefined,
    mail,
    errorMessage: "",
  }
}

export async function apiRegister(
  mail: string,
  password: string
): Promise<RegisterResult> {
  const client = createAuthClient()
  const [result, error] = await protect(client.register(mail, password))

  if (error || result?.error || !result?.data?.token) {
    return getRegisterFailure(error ?? result?.error, mail)
  }

  const { token, userId } = result.data

  return { success: true, token, userId, mail, errorMessage: "" }
}

export async function apiChangePassword(
  token: string,
  newPassword: string
): Promise<ChangePasswordResult> {
  const client = createAuthClient(token)
  const [result, error] = await protect(
    client.changePassword(token, newPassword)
  )

  if (error || result?.error || !result?.data?.token) {
    return {
      success: false,
      token: "",
      errorMessage: (error ?? result?.error)?.message ?? "",
      error: error ?? result?.error,
    }
  }

  return { success: true, token: result.data.token, errorMessage: "" }
}
