import { describe, expect, it } from "vitest"
import { Note } from "../shared/note/index.js"
import { formatNoteDate } from "../shared/note/noteTitle.js"

describe("note title helpers", () => {
  it("formats the note metadata date instead of the updated timestamp", () => {
    const note = {
      date: "2026-05-01",
      updated_at: "2026-05-08T12:00:00.000Z",
    } as Note

    expect(formatNoteDate(note)).toBe("01-05-2026")
  })
})
