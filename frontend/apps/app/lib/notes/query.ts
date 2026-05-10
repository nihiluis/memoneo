import { Note } from "@memoneo/shared"
import { type QueryClient, useQuery } from "@tanstack/react-query"

export const LAST_OPENED_NOTE_KEY = "notes.lastOpenedNoteId"
export const NOTES_LOCAL_QUERY_KEY = ["notes", "local"] as const
export const NOTES_FOLDERS_QUERY_KEY = ["notes", "folders"] as const
export const NOTES_CACHE_QUERY_KEY = ["notes", "cache"] as const

export function useNotesQuery() {
  return useQuery({
    queryKey: NOTES_LOCAL_QUERY_KEY,
    queryFn: async () => {
      const { listLocalNotes } = await import("./local")
      return sortNotes(await listLocalNotes())
    },
  })
}

export function useNoteFoldersQuery() {
  return useQuery({
    queryKey: NOTES_FOLDERS_QUERY_KEY,
    queryFn: async () => {
      const { listLocalFolderPaths } = await import("./local")
      return listLocalFolderPaths()
    },
  })
}

export function sortNotes(notes: Note[]) {
  return [...notes].sort((a, b) => getNoteTime(b) - getNoteTime(a))
}

export function upsertNoteInLocalQueryCache(
  queryClient: QueryClient,
  noteToStore: Note
) {
  queryClient.setQueryData<Note[]>(NOTES_LOCAL_QUERY_KEY, current =>
    sortNotes([
      noteToStore,
      ...(current ?? []).filter(n => n.id !== noteToStore.id),
    ])
  )
}

function getNoteTime(note: Note) {
  return new Date(note.updated_at ?? note.created_at ?? note.date).getTime()
}
