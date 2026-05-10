import type { Note } from "@memoneo/shared"
import { useQueryClient } from "@tanstack/react-query"
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
import { createLocalNote, writeLocalNote } from "@/lib/notes/local"

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
  const [styleState, setStyleState] = useState<StyleState | null>(null)
  const editorRef = useRef<EnrichedMarkdownTextInputInstance>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queryClient = useQueryClient()

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
    setBody(note?.body ?? "")
    setTitle(note?.title ?? "")
    setStyleState(null)
  }, [note])

  useEffect(() => {
    if (!note) {
      return
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const nextTitle = title.trim()
      const nextBody = body.trim()

      if (note.id === "unsaved" && !nextTitle && !nextBody) {
        return
      }

      if (note.id === "unsaved") {
        await createLocalNote(nextTitle || "Untitled", body)
      } else {
        await writeLocalNote(
          {
            ...note,
            title: nextTitle || note.title || "Untitled",
            body,
          },
          body
        )
      }

      await queryClient.invalidateQueries({ queryKey: ["notes", "local"] })
    }, 800)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [body, note, queryClient, title])

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

      {!isLoading && !error && note && (
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1"
          keyboardVerticalOffset={0}>
          <View className="flex-1">
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
