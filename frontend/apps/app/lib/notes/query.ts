import { createUnsavedNote, Note } from "@memoneo/shared"
import { useQuery } from "@tanstack/react-query"

import { listLocalNotes } from "./local"

export const LAST_OPENED_NOTE_KEY = "notes.lastOpenedNoteId"

export function useNotesQuery() {
  return useQuery({
    queryKey: ["notes", "local"],
    queryFn: async () => {
      const notes = await listLocalNotes()
      return notes.length > 0 ? sortNotes(notes) : [createUnsavedNote()]
    },
  })
}

function sortNotes(notes: Note[]) {
  return [...notes].sort((a, b) => getNoteTime(b) - getNoteTime(a))
}

function getNoteTime(note: Note) {
  return new Date(note.updated_at ?? note.created_at ?? note.date).getTime()
}
