import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"

const encryptText = vi.fn()

vi.mock("axios", () => ({
  default: {
    put: vi.fn(),
  },
}))

vi.mock("expo-crypto", () => ({
  randomUUID: () => "note-uuid",
}))

vi.mock("@/constants/env", () => ({
  API_BASE_URL: "https://api.test",
  AUTH_BASE_URL: "https://auth.test",
}))

vi.mock("@/modules/enckey", () => ({
  default: {
    encryptText,
  },
}))

const mockedAxios = vi.mocked(axios)

describe("uploadTranscript", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("encrypts and uploads a transcript as a note", async () => {
    encryptText.mockResolvedValue("1234567890123456encrypted-body")
    mockedAxios.put.mockResolvedValue({ data: { id: "note-uuid" } })
    const { uploadTranscript } = await import("./api")

    await uploadTranscript(
      "token",
      "unused-iv",
      "user-1",
      {
        title: "Meeting",
        uri: "file:///meeting.m4a",
        filename: "123-Meeting.m4a",
        timestamp: Date.parse("2026-01-01T00:00:00.000Z"),
        extension: "m4a",
        dateString: "1/1/2026",
      },
      "Transcript"
    )

    expect(mockedAxios.put).toHaveBeenCalledWith(
      "https://api.test/note",
      expect.objectContaining({
        id: "note-uuid",
        body: "encrypted-body",
        body_iv: "1234567890123456",
        title: "Meeting",
        user_id: "user-1",
      }),
      expect.objectContaining({
        headers: { Authorization: "Bearer token" },
      })
    )
  })

  it("does not upload when encryption fails", async () => {
    encryptText.mockRejectedValue(new Error("encryption failed"))
    const { uploadTranscript } = await import("./api")

    await uploadTranscript(
      "token",
      "unused-iv",
      "user-1",
      {
        title: "Meeting",
        uri: "file:///meeting.m4a",
        filename: "123-Meeting.m4a",
        timestamp: 123,
        extension: "m4a",
        dateString: "date",
      },
      "Transcript"
    )

    expect(mockedAxios.put).not.toHaveBeenCalled()
  })
})
