import { useAtomValue } from "jotai"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

import { NoteReader } from "@/components/note/editor/NoteReader"
import { useNotesQuery } from "@/lib/notes/query"
import { selectedNoteIdAtom } from "@/lib/notes/state"

export default function NotesScreen() {
  const selectedNoteId = useAtomValue(selectedNoteIdAtom)
  const notesQuery = useNotesQuery()
  const notes = notesQuery.data ?? []
  const selectedNote =
    notes.find(note => note.id === selectedNoteId) ?? notes[0] ?? null
  const insets = useSafeAreaInsets()

  return (
    <SafeAreaView
      className="bg-background"
      edges={["top", "left", "right"]}
      style={{ flex: 1 }}>
      <NoteReader
        bottomInset={insets.bottom}
        error={notesQuery.error}
        isLoading={notesQuery.isLoading}
        note={selectedNote}
      />
    </SafeAreaView>
  )
}
