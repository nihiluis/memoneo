import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedAxios = vi.mocked(axios)

describe("transcribe api", () => {
  beforeEach(() => {
    vi.stubEnv("EXPO_PUBLIC_TRANSCRIBE_BASE_URL", "https://transcribe.test")
  })

  it("queues a transcription and returns the server id", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        message: "OK",
        id: "4a622bee-fbf3-43fb-af61-7f4d535db5a7",
        status: "QUEUED",
      },
    })
    const { queueTranscription } = await import("./index")

    await expect(queueTranscription("existing-id", "file:///record.m4a")).resolves.toBe(
      "4a622bee-fbf3-43fb-af61-7f4d535db5a7"
    )
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "https://transcribe.test/transcribe/existing-id",
      expect.any(FormData),
      expect.objectContaining({ timeout: 1000 })
    )
  })

  it("gets and validates a transcription result", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        message: "OK",
        id: "4a622bee-fbf3-43fb-af61-7f4d535db5a7",
        status: "COMPLETED",
        text: "Transcript",
      },
    })
    const { getTranscription } = await import("./index")

    await expect(getTranscription("job-1")).resolves.toMatchObject({
      status: "COMPLETED",
      text: "Transcript",
    })
  })
})
