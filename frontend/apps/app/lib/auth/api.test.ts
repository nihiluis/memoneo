import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"

const createAndStoreKey = vi.fn()

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock("@/constants/env", () => ({
  AUTH_BASE_URL: "https://auth.test",
  CHECK_AUTH_PATH: "/check",
  LOGIN_PATH: "/login",
}))

vi.mock("@/modules/enckey", () => ({
  default: {
    createAndStoreKey,
  },
}))

const mockedAxios = vi.mocked(axios)

describe("auth api", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("checks an existing token and returns auth data", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        token: "next-token",
        userId: "user-1",
        mail: "pablo@example.com",
        enckey: { key: "key", salt: "salt" },
      },
    })
    const { apiCheckAuth } = await import("./api")

    await expect(apiCheckAuth("token")).resolves.toMatchObject({
      success: true,
      token: "next-token",
      userId: "user-1",
      mail: "pablo@example.com",
    })
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://auth.test/check",
      expect.objectContaining({
        headers: { Authorization: "Bearer token" },
        timeout: 3000,
      })
    )
  })

  it("logs in and stores the encryption key when returned", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        token: "token",
        userId: "user-1",
        enckey: { key: "key", salt: "salt" },
      },
    })
    const { apiLogin } = await import("./api")

    await expect(apiLogin("pablo@example.com", "password")).resolves.toMatchObject({
      success: true,
      token: "token",
      userId: "user-1",
    })
    expect(createAndStoreKey).toHaveBeenCalledWith("password", "key", "salt")
  })

  it("returns a failed result when login fails", async () => {
    mockedAxios.post.mockRejectedValue(new Error("network down"))
    const { apiLogin } = await import("./api")

    await expect(apiLogin("pablo@example.com", "password")).resolves.toMatchObject({
      success: false,
      token: "",
      errorMessage: "network down",
    })
  })
})
