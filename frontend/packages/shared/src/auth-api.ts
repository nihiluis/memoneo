import createClient from "openapi-fetch"
import { paths } from "./auth-openapi-types.js"

type AuthOpenApiResult = { data?: unknown; error?: unknown; response: Response }
export type AuthApiResult<T> = { data?: T; error?: Error }

export type Enckey = {
  id?: string
  key: string
  salt: string
  createdAt?: string
}

export type AuthResponse = {
  token: string
  enckey?: Enckey
  userId: string
  authUserId?: string
  mail: string
}

export type RegisterResponse = {
  token: string
  userId: string
  mail: string
}

export type ChangePasswordResponse = {
  token: string
}

export class MemoneoAuthApiClient {
  private readonly client

  constructor(
    private readonly baseUrl: string,
    private readonly token: string = "",
    private readonly proxyAuthorizationHeader: string = ""
  ) {
    this.client = createClient<paths>({
      baseUrl,
      credentials: "include",
      headers: this.getHeaders(),
    })
  }

  async checkAuth(existingToken: string = ""): Promise<AuthApiResult<AuthResponse>> {
    return this.request(
      this.client.GET("/auth", {
        headers: this.getHeaders(existingToken || this.token),
      })
    )
  }

  async login(mail: string, password: string): Promise<AuthApiResult<AuthResponse>> {
    return this.request(this.client.POST("/login", { body: { mail, password } }))
  }

  async register(
    mail: string,
    password: string
  ): Promise<AuthApiResult<RegisterResponse>> {
    return this.request(this.client.POST("/register", { body: { mail, password } }))
  }

  async changePassword(
    token: string,
    password: string
  ): Promise<AuthApiResult<ChangePasswordResponse>> {
    return this.request(
      this.client.POST("/auth/password", {
        headers: this.getHeaders(token),
        body: { password },
      })
    )
  }

  async saveKey(
    token: string,
    key: string,
    salt: string
  ): Promise<AuthApiResult<Record<string, never>>> {
    return this.request(
      this.client.POST("/enckey/save", {
        headers: this.getHeaders(token),
        body: { key, salt },
      })
    )
  }

  private getHeaders(token: string = this.token) {
    return {
      "content-type": "application/json",
      "Proxy-Authorization": this.proxyAuthorizationHeader,
      Authorization: token ? `Bearer ${token}` : "",
    }
  }

  private async request<T>(
    request: Promise<AuthOpenApiResult>
  ): Promise<AuthApiResult<T>> {
    try {
      const result = await request
      if (result.error) {
        return { error: this.toError(result.error, result.response) }
      }

      return { data: result.data as T }
    } catch (error) {
      return { error: this.toTransportError(error) }
    }
  }

  private toTransportError(error: unknown): Error {
    if (error instanceof Error) {
      return new Error(
        `Auth request failed for ${this.baseUrl}: ${getErrorMessages(error)}`,
        { cause: error }
      )
    }

    return new Error(`Auth request failed for ${this.baseUrl}: ${String(error)}`)
  }

  private toError(error: unknown, response: Response): Error {
    if (error instanceof Error) {
      return error
    }

    const detail = typeof error === "string" ? error : JSON.stringify(error)
    return new Error(
      `Auth request failed: ${response.status} ${response.statusText}${
        detail ? `: ${detail}` : ""
      }`
    )
  }
}

function getErrorMessages(error: Error): string {
  const messages: string[] = []
  let current: unknown = error

  while (current instanceof Error) {
    const currentMessage = current.message
    const alreadyIncluded = messages.some(
      message =>
        message === currentMessage || message.includes(currentMessage)
    )
    if (currentMessage && !alreadyIncluded) {
      messages.push(currentMessage)
    }

    current = current.cause
  }

  return messages.join(": ")
}

export function createAuthApiClient(
  baseUrl: string,
  token: string = "",
  proxyAuthorizationHeader: string = ""
) {
  return new MemoneoAuthApiClient(baseUrl, token, proxyAuthorizationHeader)
}
