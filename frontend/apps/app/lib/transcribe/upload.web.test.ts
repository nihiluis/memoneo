import axios from "axios"
import { afterEach, expect, it, vi } from "vitest"
import { uploadRecording } from "./upload.web"
vi.mock("axios", () => ({
  default: { post: vi.fn().mockResolvedValue({ data: {} }) },
}))
afterEach(() => vi.unstubAllGlobals())
it("uploads a browser blob and lets the browser set the multipart boundary", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({
        blob: async () => new Blob(["audio"], { type: "audio/webm" }),
      })
  )
  await uploadRecording("job-id", "blob:recording")
  const [, form, config] = vi.mocked(axios.post).mock.calls[0]
  const file = (form as FormData).get("file") as File
  expect(file.name).toBe("recording.webm")
  expect(file.type).toBe("audio/webm")
  expect(await file.text()).toBe("audio")
  expect(config).not.toHaveProperty("headers")
})
