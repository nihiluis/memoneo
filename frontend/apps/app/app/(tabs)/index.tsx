import { Note } from "@memoneo/shared"
import { useAtomValue } from "jotai"
import {
  Bold,
  Italic,
  Menu,
  Strikethrough,
  Underline,
} from "lucide-react-native"
import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native"
import {
  EnrichedMarkdownTextInput,
  type EnrichedMarkdownTextInputInstance,
  type StyleState,
} from "react-native-enriched-markdown"
import { KeyboardAvoidingView } from "react-native-keyboard-controller"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

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
      <SafeAreaView
        className="bg-background"
        edges={["top", "left", "right"]}
        style={{ flex: 1 }}>
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
  const insets = useSafeAreaInsets()
  const [body, setBody] = useState("")
  const [title, setTitle] = useState("")
  const [isDecryptingBody, setIsDecryptingBody] = useState(false)
  const [styleState, setStyleState] = useState<StyleState | null>(null)
  const editorRef = useRef<EnrichedMarkdownTextInputInstance>(null)

  useEffect(() => {
    let cancelled = false
    setBody("")
    setTitle(getNoteTitle(note))
    setStyleState(null)
    setIsDecryptingBody(!!note)

    async function decryptBody() {
      if (!note) {
        return
      }

      try {
        const decrypted = await enckey.decryptText(note.body, note.body_iv)
        if (!cancelled) {
          setBody(decrypted)
          setIsDecryptingBody(false)
        }
      } catch (decryptError) {
        console.error("Failed to decrypt note body", decryptError)
        if (!cancelled) {
          setBody(note.decryptedBody ?? note.body)
          setIsDecryptingBody(false)
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
        <TextInput
          className="flex-1 p-0 text-2xl font-semibold text-foreground"
          editable={!!note}
          onChangeText={setTitle}
          placeholder="Untitled"
          placeholderTextColor="#71717a"
          value={title}
        />
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
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1"
          keyboardVerticalOffset={0}>
          {isDecryptingBody ? (
            <View className="flex-1 px-4 py-4">
              <MText className="text-lg leading-7 text-muted-foreground">
                Decrypting note...
              </MText>
            </View>
          ) : (
            <EnrichedMarkdownTextInput
              key={`${note.id}:${note.updated_at ?? note.version}`}
              ref={editorRef}
              defaultValue={body}
              onChangeMarkdown={setBody}
              onChangeState={setStyleState}
              placeholder="Start writing..."
              placeholderTextColor="#71717a"
              selectionColor="#94a3b8"
              style={styles.editor}
              markdownStyle={{
                strong: { color: "#f8fafc" },
                em: { color: "#f8fafc" },
                link: { color: "#60a5fa", underline: true },
              }}
            />
          )}
          <MarkdownToolbar
            editorRef={editorRef}
            bottomInset={insets.bottom}
            styleState={styleState}
          />
        </KeyboardAvoidingView>
      )}
    </View>
  )
}

function MarkdownToolbar({
  bottomInset,
  editorRef,
  styleState,
}: {
  bottomInset: number
  editorRef: React.RefObject<EnrichedMarkdownTextInputInstance | null>
  styleState: StyleState | null
}) {
  return (
    <View
      className="bg-background px-4"
      style={{ paddingBottom: bottomInset + TOOLBAR_GAP }}>
      <View className="flex-row items-center justify-center gap-1 rounded-full bg-muted px-4 py-2">
        <ToolbarButton
          accessibilityLabel="Bold"
          active={styleState?.bold.isActive}
          onPress={() => editorRef.current?.toggleBold()}>
          <Bold
            size={18}
            color={styleState?.bold.isActive ? "#f8fafc" : "#a1a1aa"}
          />
        </ToolbarButton>
        <ToolbarButton
          accessibilityLabel="Italic"
          active={styleState?.italic.isActive}
          onPress={() => editorRef.current?.toggleItalic()}>
          <Italic
            size={18}
            color={styleState?.italic.isActive ? "#f8fafc" : "#a1a1aa"}
          />
        </ToolbarButton>
        <ToolbarButton
          accessibilityLabel="Underline"
          active={styleState?.underline.isActive}
          onPress={() => editorRef.current?.toggleUnderline()}>
          <Underline
            size={18}
            color={styleState?.underline.isActive ? "#f8fafc" : "#a1a1aa"}
          />
        </ToolbarButton>
        <ToolbarButton
          accessibilityLabel="Strikethrough"
          active={styleState?.strikethrough.isActive}
          onPress={() => editorRef.current?.toggleStrikethrough()}>
          <Strikethrough
            size={18}
            color={styleState?.strikethrough.isActive ? "#f8fafc" : "#a1a1aa"}
          />
        </ToolbarButton>
      </View>
    </View>
  )
}

function ToolbarButton({
  accessibilityLabel,
  active,
  children,
  onPress,
}: {
  accessibilityLabel: string
  active?: boolean
  children: React.ReactNode
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className={[
        "h-10 w-10 items-center justify-center rounded-md",
        active ? "bg-muted" : "bg-transparent",
      ].join(" ")}
      onPress={onPress}>
      {children}
    </Pressable>
  )
}

const TOOLBAR_GAP = 12

const styles = StyleSheet.create({
  editor: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
    fontSize: 18,
    lineHeight: 40,
    color: "#f8fafc",
    backgroundColor: "transparent",
    textAlignVertical: "top",
  },
})

function getNoteTitle(note: Note | null) {
  return note?.file?.title ?? note?.title ?? ""
}
