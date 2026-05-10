import { useAtomValue } from "jotai"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

import { NoteSelector } from "@/components/note/NoteSelector"
import { NoteReader } from "@/components/note/editor/NoteReader"
import {
  selectedNoteAtom,
  selectedNoteIdAtom,
  useNotesState,
} from "@/lib/notes/state"

export default function NotesScreen() {
  const selectedNoteId = useAtomValue(selectedNoteIdAtom)
  const selectedNote = useAtomValue(selectedNoteAtom)
  const notesState = useNotesState()
  const insets = useSafeAreaInsets()

  return (
    <SafeAreaView
      className="bg-background"
      edges={["top", "left", "right"]}
      style={{ flex: 1 }}>
      <NoteSelector
        isLoading={notesState.isLoading}
        notes={notesState.notes}
        selectedNoteId={selectedNoteId}
      />
      <NoteReader
        bottomInset={insets.bottom}
        error={notesState.error}
        isLoading={notesState.isLoading}
        note={selectedNote}
      />
    </SafeAreaView>
  )
}
