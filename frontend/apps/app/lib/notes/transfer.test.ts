import { describe, expect, it } from "vitest"
import type { MarkdownFileInfo, Note } from "@memoneo/shared"
import { getTransferNotes, transferId } from "./transfer"

const local = (id?: string): MarkdownFileInfo => ({
  fileName: id || "New",
  path: "folder",
  text: "text",
  metadata: { id },
  createdTime: new Date(),
  modifiedTime: new Date(),
})
const remote = (id: string, archived = false) =>
  ({ id, title: id, archived } as Note)

describe("transfer eligibility", () => {
  const files = [local("existing"), local()]
  const notes = [
    remote("existing"),
    remote("missing"),
    remote("archived", true),
  ]
  it("only offers missing non-archived remote notes for download", () => {
    expect(
      getTransferNotes("download", files, notes).map(note => note.id)
    ).toEqual(["missing"])
  })
  it("only offers new local notes for upload", () => {
    expect(
      getTransferNotes("upload", files, notes).map(note => note.id)
    ).toEqual([transferId(files[1])])
  })
  it("offers the union for sync without duplicating linked notes", () => {
    expect(
      new Set(getTransferNotes("sync", files, notes).map(note => note.id))
    ).toEqual(new Set(["existing", "missing", transferId(files[1])]))
  })
  it("handles empty libraries", () => {
    expect(getTransferNotes("sync", [], [])).toEqual([])
  })
})
