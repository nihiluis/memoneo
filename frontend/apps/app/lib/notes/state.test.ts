import type { Note } from "@memoneo/shared"
import { createStore } from "jotai/vanilla"
import { describe, expect, it } from "vitest"

import {
  selectedFolderIdAtom,
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
  it("defaults to no selected note and no selected folder", () => {
    const store = createStore()

    expect(store.get(selectedNoteIdAtom)).toBe("")
    expect(store.get(selectedNoteAtom)).toBeNull()
    expect(store.get(selectedFolderIdAtom)).toBe("")
  })

  it("sets the selected folder to the selected note parent", () => {
    const store = createStore()
    const selectedNote = note("a", "Work/Ideas")

    store.set(selectedNoteAtom, selectedNote)

    expect(store.get(selectedNoteAtom)).toBe(selectedNote)
    expect(store.get(selectedFolderIdAtom)).toBe("Work/Ideas")
  })

  it("normalizes selected note parent paths", () => {
    const store = createStore()

    store.set(selectedNoteAtom, note("a", " Work\\Ideas/ "))

    expect(store.get(selectedFolderIdAtom)).toBe("Work/Ideas")
  })

  it("uses an empty selected folder for top-level notes and no notes", () => {
    const store = createStore()

    store.set(selectedFolderIdAtom, "Work")
    store.set(selectedNoteAtom, note("a"))
    expect(store.get(selectedFolderIdAtom)).toBe("")

    store.set(selectedFolderIdAtom, "Work")
    store.set(selectedNoteAtom, null)
    expect(store.get(selectedNoteAtom)).toBeNull()
    expect(store.get(selectedFolderIdAtom)).toBe("")
  })
})
