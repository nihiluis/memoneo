import AsyncStorage from "@react-native-async-storage/async-storage"
import type { Note } from "@memoneo/shared"
import { useSetAtom } from "jotai"
import { useEffect } from "react"

import { LAST_OPENED_NOTE_KEY } from "@/lib/notes/query"
import { selectedNoteAtom, selectedNoteIdAtom } from "@/lib/notes/state"

type NoteSelectorProps = {
  isLoading: boolean
  notes: Note[]
  selectedNoteId: string
}

export function NoteSelector({
  isLoading,
  notes,
  selectedNoteId,
}: NoteSelectorProps) {
  const setSelectedNote = useSetAtom(selectedNoteAtom)
  const setSelectedNoteId = useSetAtom(selectedNoteIdAtom)

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
      setSelectedNote(null)
      return
    }

    const selectedNote = notes.find(note => note.id === selectedNoteId) ?? null
    setSelectedNote(selectedNote)

    if (!selectedNote) {
      void AsyncStorage.removeItem(LAST_OPENED_NOTE_KEY)
      return
    }

    void AsyncStorage.setItem(LAST_OPENED_NOTE_KEY, selectedNote.id)
  }, [isLoading, notes, selectedNoteId, setSelectedNote])

  return null
}
