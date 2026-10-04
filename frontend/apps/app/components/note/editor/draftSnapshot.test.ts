import { describe, expect, it } from "vitest"

import { isDraftDirty, type DraftSnapshot } from "./draftSnapshot"

const savedDraft: DraftSnapshot = {
  noteId: "note-1",
  title: "Meeting notes",
  body: "Follow up with the team",
}

describe("isDraftDirty", () => {
  it("is false when the current draft matches the saved note", () => {
    expect(isDraftDirty(savedDraft, { ...savedDraft })).toBe(false)
  })

  it.each([
    { ...savedDraft, title: "Updated title" },
    { ...savedDraft, body: "Updated body" },
    { ...savedDraft, noteId: "note-2" },
  ])("is true when the current draft differs from the saved note", draft => {
    expect(isDraftDirty(savedDraft, draft)).toBe(true)
  })

  it("is false when there is no current or saved draft", () => {
    expect(isDraftDirty(null, savedDraft)).toBe(false)
    expect(isDraftDirty(savedDraft, null)).toBe(false)
  })
})
