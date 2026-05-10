import AsyncStorage from "@react-native-async-storage/async-storage"
import { useAtom, useSetAtom } from "jotai"
import { useEffect } from "react"

import { LAST_OPENED_NOTE_KEY } from "@/lib/notes/query"
import {
  getNoteParentFolderId,
  selectedFolderIdAtom,
  selectedNoteIdAtom,
  useNotesState,
} from "@/lib/notes/state"

export function NoteSelector() {
  const { notes, isLoading } = useNotesState()
  const setSelectedFolderId = useSetAtom(selectedFolderIdAtom)
  const [selectedNoteId, setSelectedNoteId] = useAtom(selectedNoteIdAtom)

  useEffect(() => {
    if (isLoading || selectedNoteId || notes.length === 0) {
      return
    }

    let cancelled = false

    AsyncStorage.getItem(LAST_OPENED_NOTE_KEY).then(lastOpenedNoteId => {
      if (
        cancelled ||
        !lastOpenedNoteId ||
        !notes.some(note => note.id === lastOpenedNoteId)
      ) {
        return
      }

      setSelectedNoteId(lastOpenedNoteId)
    })

    return () => {
      cancelled = true
    }
  }, [isLoading, notes, selectedNoteId, setSelectedNoteId])

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (!selectedNoteId) {
      setSelectedFolderId("")
      return
    }

    const selectedNote = notes.find(note => note.id === selectedNoteId) ?? null

    if (!selectedNote) {
      setSelectedFolderId("")
      void AsyncStorage.removeItem(LAST_OPENED_NOTE_KEY)
      return
    }

    setSelectedFolderId(getNoteParentFolderId(selectedNote))
    void AsyncStorage.setItem(LAST_OPENED_NOTE_KEY, selectedNote.id)
  }, [isLoading, notes, selectedNoteId, setSelectedFolderId])

  return null
}
