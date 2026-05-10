import { Note } from "@memoneo/shared"
import { useQuery } from "@tanstack/react-query"

import { listLocalFolderPaths, listLocalNotes } from "./local"

export const LAST_OPENED_NOTE_KEY = "notes.lastOpenedNoteId"
export const NOTES_LOCAL_QUERY_KEY = ["notes", "local"] as const
export const NOTES_FOLDERS_QUERY_KEY = ["notes", "folders"] as const
export const NOTES_CACHE_QUERY_KEY = ["notes", "cache"] as const

export function useNotesQuery() {
  return useQuery({
    queryKey: NOTES_LOCAL_QUERY_KEY,
    queryFn: async () => sortNotes(await listLocalNotes()),
  })
}

export function useNoteFoldersQuery() {
  return useQuery({
    queryKey: NOTES_FOLDERS_QUERY_KEY,
    queryFn: listLocalFolderPaths,
  })
}

function sortNotes(notes: Note[]) {
  return [...notes].sort((a, b) => getNoteTime(b) - getNoteTime(a))
}

function getNoteTime(note: Note) {
  return new Date(note.updated_at ?? note.created_at ?? note.date).getTime()
}
