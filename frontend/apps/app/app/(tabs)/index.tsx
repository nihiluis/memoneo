import { useAtomValue } from "jotai"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

import { NoteSelector } from "@/components/note/NoteSelector"
import { NoteReader } from "@/components/note/editor/NoteReader"
import { useNotesQuery } from "@/lib/notes/query"
import { selectedNoteAtom, selectedNoteIdAtom } from "@/lib/notes/state"

export default function NotesScreen() {
  const selectedNoteId = useAtomValue(selectedNoteIdAtom)
  const selectedNote = useAtomValue(selectedNoteAtom)
  const notesQuery = useNotesQuery()
  const notes = notesQuery.data ?? []
  const insets = useSafeAreaInsets()

  return (
    <SafeAreaView
      className="bg-background"
      edges={["top", "left", "right"]}
      style={{ flex: 1 }}>
      <NoteSelector
        isLoading={notesQuery.isLoading}
        notes={notes}
        selectedNoteId={selectedNoteId}
      />
      <NoteReader
        bottomInset={insets.bottom}
        error={notesQuery.error}
        isLoading={notesQuery.isLoading}
        note={selectedNote}
      />
    </SafeAreaView>
  )
}
