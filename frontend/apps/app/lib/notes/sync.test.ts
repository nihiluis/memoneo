import type { MarkdownFileInfo, Note } from "@memoneo/shared"
import { describe, expect, it } from "vitest"

import {
  getDownloadOverwriteWarning,
  getUploadOverwriteWarning,
} from "./syncWarnings"

function note(overrides: Partial<Note> = {}): Note {
  return {
    id: "note-1",
    user_id: "user-1",
    title: "Note",
    body: "",
    body_iv: "",
    date: "2026-01-01T00:00:00.000Z",
    archived: false,
    version: 1,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    file: {
      note_id: "note-1",
      title: "Note",
      path: "",
    },
    ...overrides,
  }
}

function file(overrides: Partial<MarkdownFileInfo> = {}): MarkdownFileInfo {
  return {
    fileName: "Note",
    path: "",
    text: "body",
    modifiedTime: new Date("2026-01-01T00:00:00.000Z"),
    createdTime: new Date("2026-01-01T00:00:00.000Z"),
    metadata: {
      id: "note-1",
      title: "Note",
      date: "2026-01-01T00:00:00.000Z",
      version: 1,
    },
    ...overrides,
  }
}

describe("single note sync overwrite warnings", () => {
  it("warns before uploading over a newer remote version", () => {
    const warning = getUploadOverwriteWarning(
      note({ version: 2 }),
      file({ metadata: { id: "note-1", version: 1 } }),
      { lastSync: "2026-01-01T00:00:00.000Z" }
    )

    expect(warning?.title).toBe("Overwrite newer remote note?")
  })

  it("warns before uploading when remote changed after the last sync", () => {
    const warning = getUploadOverwriteWarning(note(), file(), {
      lastSync: "2025-12-31T00:00:00.000Z",
    })

    expect(warning?.confirmText).toBe("Upload anyway")
  })

  it("does not warn for upload when local metadata has caught up", () => {
    const warning = getUploadOverwriteWarning(
      note({ version: 2, updated_at: "2026-01-02T00:00:00.000Z" }),
      file({ metadata: { id: "note-1", version: 2 } }),
      { lastSync: "2026-01-02T00:00:00.000Z" }
    )

    expect(warning).toBeNull()
  })

  it("warns before downloading over a locally modified note", () => {
    const warning = getDownloadOverwriteWarning(
      note(),
      file({ modifiedTime: new Date("2026-01-03T00:00:00.000Z") }),
      { lastSync: "2026-01-02T00:00:00.000Z" }
    )

    expect(warning?.title).toBe("Overwrite newer local note?")
  })

  it("does not warn for download when local file is older than remote and cache", () => {
    const warning = getDownloadOverwriteWarning(
      note({ updated_at: "2026-01-03T00:00:00.000Z" }),
      file({ modifiedTime: new Date("2026-01-02T00:00:00.000Z") }),
      { lastSync: "2026-01-03T00:00:00.000Z" }
    )

    expect(warning).toBeNull()
  })
})
