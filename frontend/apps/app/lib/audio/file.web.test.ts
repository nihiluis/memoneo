import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import { clearRecords } from "@/lib/web/database"
import {
  deleteRecordFile,
  getRecordFiles,
  getRecording,
  saveRecording,
  updateMetadata,
} from "./file.web"

describe("browser recording persistence", () => {
  beforeEach(() => clearRecords("recordings"))
  it("stores audio blobs and transcription metadata independently of object URLs", async () => {
    const id = await saveRecording(
      new Blob(["audio data"], { type: "audio/webm" }),
      "Voice note"
    )
    expect((await getRecordFiles())[0]).toMatchObject({
      filename: id,
      extension: "webm",
      title: "Voice note",
    })
    expect(await (await getRecording(id)).blob.text()).toBe("audio data")
    const metadata = {
      transcribe: {
        status: "COMPLETED" as const,
        text: "Transcript",
        id: "job-id",
      },
    }
    await updateMetadata(id, metadata)
    expect((await getRecording(id)).metadata).toEqual(metadata)
    await deleteRecordFile((await getRecordFiles())[0])
    expect(await getRecordFiles()).toEqual([])
    await expect(getRecording(id)).rejects.toThrow("not found")
  })
})
