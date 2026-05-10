import type { Note } from "@memoneo/shared"
import { createStore } from "jotai/vanilla"
import { describe, expect, it } from "vitest"

import {
  getNoteParentFolderId,
  notesAtom,
  selectedNoteAtom,
  selectedNoteIdAtom,
} from "./state"

function note(id: string, path?: string): Note {
  return {
    id,
    title: id,
    body: "",
    body_iv: "",
    date: "2026-01-01T00:00:00.000Z",
    version: 1,
    archived: false,
    user_id: "user-1",
    file: path === undefined ? null : { title: id, path, note_id: id },
  } as Note
}

describe("notes selection state", () => {
  it("defaults to no selected note", () => {
    const store = createStore()

    expect(store.get(selectedNoteIdAtom)).toBe("")
    expect(store.get(selectedNoteAtom)).toBeNull()
  })

  it("derives the selected note from id and in-memory notes list", () => {
    const store = createStore()
    const selectedNote = note("a", "Work/Ideas")

    store.set(notesAtom, [selectedNote])
    store.set(selectedNoteIdAtom, "a")

    expect(store.get(selectedNoteAtom)).toBe(selectedNote)
  })

  it("returns null when the id is not in the notes list", () => {
    const store = createStore()

    store.set(notesAtom, [note("b")])
    store.set(selectedNoteIdAtom, "a")

    expect(store.get(selectedNoteAtom)).toBeNull()
  })

  it("clears derived note when id is cleared", () => {
    const store = createStore()

    store.set(notesAtom, [note("a")])
    store.set(selectedNoteIdAtom, "a")
    expect(store.get(selectedNoteAtom)).not.toBeNull()

    store.set(selectedNoteIdAtom, "")
    expect(store.get(selectedNoteAtom)).toBeNull()
  })
})

describe("getNoteParentFolderId", () => {
  it("returns normalized parent path segments", () => {
    expect(getNoteParentFolderId(note("a", "Work/Ideas"))).toBe("Work/Ideas")
  })

  it("normalizes slashes, backslashes, and surrounding whitespace", () => {
    expect(getNoteParentFolderId(note("a", " Work\\Ideas/ "))).toBe("Work/Ideas")
  })

  it("returns empty string for top-level notes and missing file", () => {
    expect(getNoteParentFolderId(note("a"))).toBe("")
    expect(getNoteParentFolderId(note("a", ""))).toBe("")
  })
})
