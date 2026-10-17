import { useLocalSearchParams, useRouter } from "expo-router"
import { useAtom, useSetAtom } from "jotai"
import { useEffect, useRef } from "react"

import {
  getNoteParentFolderId,
  selectedFolderIdAtom,
  selectedNoteIdAtom,
  useNotesState,
} from "@/lib/notes/state"

/** Keep selection in the URL so reloads, shared links, and browser history work. */
export function NoteSelector() {
  const { note: routeNote } = useLocalSearchParams<{ note?: string | string[] }>()
  const noteId = Array.isArray(routeNote) ? routeNote[0] : routeNote
  const router = useRouter()
  const { notes, isLoading } = useNotesState()
  const [selectedNoteId, setSelectedNoteId] = useAtom(selectedNoteIdAtom)
  const setSelectedFolderId = useSetAtom(selectedFolderIdAtom)
  const previousRoute = useRef<{ noteId: string | undefined } | null>(null)

  useEffect(() => {
    if (!previousRoute.current || previousRoute.current.noteId !== noteId) {
      previousRoute.current = { noteId }
      setSelectedNoteId(noteId ?? "")
      return
    }
    if (selectedNoteId !== (noteId ?? "")) {
      router.setParams({ note: selectedNoteId || undefined })
    }
  }, [noteId, router, selectedNoteId, setSelectedNoteId])

  useEffect(() => {
    if (isLoading) return
    const note = notes.find(note => note.id === selectedNoteId)
    setSelectedFolderId(note ? getNoteParentFolderId(note) : "")
  }, [isLoading, notes, selectedNoteId, setSelectedFolderId])

  return null
}
