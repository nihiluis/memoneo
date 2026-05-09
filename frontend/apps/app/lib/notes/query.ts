import { createApiClient, Note } from "@memoneo/shared"
import { useQuery } from "@tanstack/react-query"
import { useAtomValue } from "jotai"

import { tokenAtom } from "@/lib/auth/state"
import { getApiUrl } from "@/lib/settings/urls"

export const LAST_OPENED_NOTE_KEY = "notes.lastOpenedNoteId"

export function useNotesQuery() {
  const token = useAtomValue(tokenAtom)

  return useQuery({
    queryKey: ["notes", token],
    enabled: !!token,
    queryFn: async () => {
      const client = createApiClient(token, getApiUrl(""))
      const { data, error } = await client.getNotes()
      if (error) {
        throw error
      }
      return sortNotes(data ?? [])
    },
  })
}

function sortNotes(notes: Note[]) {
  return [...notes].sort((a, b) => getNoteTime(b) - getNoteTime(a))
}

function getNoteTime(note: Note) {
  return new Date(note.updated_at ?? note.created_at ?? note.date).getTime()
}
