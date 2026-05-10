import type { Note } from "@memoneo/shared"
import { atom } from "jotai"
import { useAtom } from "jotai"
import { useCallback, useEffect } from "react"

import { sortNotes, useNotesQuery } from "./query"

export const selectedNoteIdAtom = atom<string>("")
export const selectedFolderIdAtom = atom<string>("")

/** Expanded folders in the app drawer note tree (shared with drawer actions). */
export const drawerExpandedFolderIdsAtom = atom(new Set<string>())

/** In-memory note list mirrored from the notes query (see `useNotesState`). */
export const notesAtom = atom<Note[]>([])

export const selectedNoteAtom = atom(get => {
  const id = get(selectedNoteIdAtom)
  if (!id) {
    return null
  }
  const notes = get(notesAtom)
  return notes.find(note => note.id === id) ?? null
})

export function useNotesState() {
  const notesQuery = useNotesQuery()
  const [notes, setNotes] = useAtom(notesAtom)

  useEffect(() => {
    if (!notesQuery.data) {
      return
    }
    setNotes(notesQuery.data)
  }, [notesQuery.data, setNotes])

  const upsertNote = useCallback((noteToStore: Note) => {
    setNotes(current =>
      sortNotes([
        noteToStore,
        ...current.filter(note => note.id !== noteToStore.id),
      ])
    )
  }, [setNotes])

  const removeNote = useCallback((noteId: string) => {
    setNotes(current => current.filter(note => note.id !== noteId))
  }, [setNotes])

  return {
    ...notesQuery,
    notes,
    removeNote,
    setNotes,
    upsertNote,
  }
}

export function getNoteParentFolderId(note: Note) {
  return note.file?.path?.trim().split(/[\\/]/).filter(Boolean).join("/") ?? ""
}
