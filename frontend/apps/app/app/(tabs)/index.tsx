import { SafeAreaView } from "react-native-safe-area-context"

import { NoteSelector } from "@/components/note/NoteSelector"
import { NoteReader } from "@/components/note/editor/NoteReader"

export default function NotesScreen() {
  return (
    <SafeAreaView
      className="bg-background"
      edges={["top", "left", "right"]}
      style={{ flex: 1 }}>
      <NoteSelector />
      <NoteReader />
    </SafeAreaView>
  )
}
