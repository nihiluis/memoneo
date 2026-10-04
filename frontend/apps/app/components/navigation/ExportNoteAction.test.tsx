import type { Note } from "@memoneo/shared"
import { describe, expect, it, vi } from "vitest"
import { testingLibrary } from "../../test/react-native-testing"

const downloadBlob = vi.fn()
vi.doMock("@/lib/web/download", () => ({ downloadBlob }))
vi.doMock("lucide-react-native", () => ({ Download: () => null }))
const { ExportNoteAction } = await import("./ExportNoteAction.web")
const { render, fireEvent } = testingLibrary
const note = {
  id: "note-2", title: "Dialog note", body: "Encrypted body",
  decryptedBody: "Plain text body", file: { title: "Stored filename", path: "folder" },
} as Note

describe("ExportNoteAction", () => {
  it("downloads the dialog note with its decrypted body and filename", async () => {
    downloadBlob.mockClear()
    const result = render(<ExportNoteAction note={note} />)
    fireEvent.press(result.getByText("Export note"))
    expect(downloadBlob).toHaveBeenCalledOnce()
    const [blob, filename] = downloadBlob.mock.calls[0]
    expect(filename).toBe("Stored filename.md")
    expect(blob.type).toBe("text/markdown;charset=utf-8")
    expect(await blob.text()).toContain("Plain text body")
    expect(await blob.text()).not.toContain("Encrypted body")
  })
  it("does not export an unsaved note", () => {
    downloadBlob.mockClear()
    const result = render(<ExportNoteAction note={{ ...note, id: "unsaved" }} />)
    fireEvent.press(result.getByText("Export note"))
    expect(downloadBlob).not.toHaveBeenCalled()
  })
})
