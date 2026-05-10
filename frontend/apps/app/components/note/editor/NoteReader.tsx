import type { Note } from "@memoneo/shared"
import { useEffect, useMemo, useRef, useState } from "react"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import {
  EnrichedMarkdownTextInput,
  type EnrichedMarkdownTextInputInstance,
  type MarkdownTextInputStyle,
  type StyleState,
} from "react-native-enriched-markdown"
import { KeyboardAvoidingView } from "react-native-keyboard-controller"

import { MText } from "@/components/reusables/MText"
import enckey from "@/modules/enckey"

import { getNoteTitle } from "./getNoteTitle"
import { MarkdownToolbar } from "./MarkdownToolbar"
import { NoteHeader } from "./NoteHeader"

type NoteReaderProps = {
  bottomInset: number
  error: Error | null
  isLoading: boolean
  note: Note | null
}

export function NoteReader({
  bottomInset,
  error,
  isLoading,
  note,
}: NoteReaderProps) {
  const [body, setBody] = useState("")
  const [title, setTitle] = useState("")
  const [isDecryptingBody, setIsDecryptingBody] = useState(false)
  const [styleState, setStyleState] = useState<StyleState | null>(null)
  const editorRef = useRef<EnrichedMarkdownTextInputInstance>(null)

  const markdownStyle: MarkdownTextInputStyle = useMemo(
    () => ({
      strong: { color: "#f8fafc" },
      em: { color: "#f8fafc" },
      link: { color: "#60a5fa", underline: true },
      lineHeight: 24,
    }),
    [],
  )

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
      <NoteHeader note={note} title={title} onChangeTitle={setTitle} />

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
          <View className="flex-1">
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
                markdownStyle={markdownStyle}
                onChangeMarkdown={setBody}
                onChangeState={setStyleState}
                placeholder="Start writing..."
                placeholderTextColor="#71717a"
                selectionColor="#94a3b8"
                style={styles.editor}
              />
            )}
            <MarkdownToolbar
              bottomInset={bottomInset}
              editorRef={editorRef}
              styleState={styleState}
            />
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  editor: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 24,
    fontSize: 16,
    lineHeight: 54,
    color: "#f8fafc",
    backgroundColor: "transparent",
    textAlignVertical: "top",
  },
})
