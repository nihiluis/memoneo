import { Note } from "@memoneo/shared"
import { useAtomValue } from "jotai"
import { Menu } from "lucide-react-native"
import { useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import AuthScreen from "@/components/auth/AuthScreen"
import { useAppDrawer } from "@/components/navigation/AppDrawer"
import { MText } from "@/components/reusables/MText"
import { useNotesQuery } from "@/lib/notes/query"
import { selectedNoteIdAtom } from "@/lib/notes/state"
import enckey from "@/modules/enckey"

export default function NotesScreen() {
  const selectedNoteId = useAtomValue(selectedNoteIdAtom)
  const notesQuery = useNotesQuery()
  const notes = useMemo(() => notesQuery.data ?? [], [notesQuery.data])
  const selectedNote = notes.find(note => note.id === selectedNoteId) ?? null

  return (
    <AuthScreen>
      <SafeAreaView className="bg-background" style={{ flex: 1 }}>
        <NoteReader
          error={notesQuery.error}
          isLoading={notesQuery.isLoading}
          note={selectedNote}
        />
      </SafeAreaView>
    </AuthScreen>
  )
}

function NoteReader({
  error,
  isLoading,
  note,
}: {
  error: Error | null
  isLoading: boolean
  note: Note | null
}) {
  const { openDrawer } = useAppDrawer()
  const [body, setBody] = useState("")

  useEffect(() => {
    let cancelled = false
    setBody("")

    async function decryptBody() {
      if (!note) {
        return
      }

      try {
        const decrypted = await enckey.decryptText(note.body, note.body_iv)
        if (!cancelled) {
          setBody(decrypted)
        }
      } catch (decryptError) {
        console.error("Failed to decrypt note body", decryptError)
        if (!cancelled) {
          setBody(note.decryptedBody ?? note.body)
        }
      }
    }

    decryptBody()

    return () => {
      cancelled = true
    }
  }, [note])

  return (
    <View className="flex-1">
      <View className="h-14 flex-row items-center border-b border-border px-4">
        <Pressable
          accessibilityRole="button"
          className="mr-3 h-10 w-10 items-center justify-center rounded-md"
          onPress={openDrawer}>
          <Menu size={24} color="#a1a1aa" />
        </Pressable>
        <MText className="flex-1 text-2xl font-semibold" numberOfLines={1}>
          {note?.title ?? ""}
        </MText>
      </View>

      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}

      {!isLoading && error && (
        <View className="flex-1 justify-center px-6">
          <MText className="text-center text-destructive">
            Failed to load notes.
          </MText>
        </View>
      )}

      {!isLoading && !error && !note && (
        <View className="flex-1 justify-center px-6">
          <MText className="text-center text-muted-foreground">
            No note selected.
          </MText>
        </View>
      )}

      {!isLoading && !error && note && (
        <ScrollView
          className="flex-1 px-4 py-4">
          <MText className="text-lg leading-7 text-foreground">
            {body || "Decrypting note..."}
          </MText>
        </ScrollView>
      )}
    </View>
  )
}