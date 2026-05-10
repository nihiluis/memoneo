import type { Note } from "@memoneo/shared"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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

const AUTOSAVE_DELAY_MS = 5000

type NoteReaderProps = {
  bottomInset: number
  error: Error | null
  isLoading: boolean
  note: Note | null
}

type DraftSnapshot = {
  noteId: string
  title: string
  body: string
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
  const noteRef = useRef<Note | null>(null)
  const draftRef = useRef<DraftSnapshot | null>(null)
  const lastSavedDraftRef = useRef<DraftSnapshot | null>(null)
  const hydratedNoteIdRef = useRef<string | null>(null)
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

  const clearScheduledSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
  }, [])

  const saveDraft = useCallback(async () => {
    clearScheduledSave()

    const currentNote = noteRef.current
    const draft = draftRef.current

    if (!currentNote || !draft) {
      return
    }

    const nextTitle = draft.title.trim()
    const nextBody = draft.body.trim()

    if (currentNote.id === "unsaved" && !nextTitle && !nextBody) {
      return
    }

    const lastSavedDraft = lastSavedDraftRef.current
    if (
      lastSavedDraft?.noteId === draft.noteId &&
      lastSavedDraft.title === draft.title &&
      lastSavedDraft.body === draft.body
    ) {
      return
    }

    if (currentNote.id === "unsaved") {
      lastSavedDraftRef.current = draft
      const createdNote = await createLocalNote(nextTitle || "Untitled", draft.body)
      const createdDraft = {
        noteId: createdNote.id,
        title: createdNote.title,
        body: createdNote.body,
      }
      if (draftRef.current === draft && noteRef.current?.id === currentNote.id) {
        draftRef.current = createdDraft
        lastSavedDraftRef.current = createdDraft
      }
    } else {
      await writeLocalNote(
        {
          ...currentNote,
          title: nextTitle || currentNote.title || "Untitled",
          body: draft.body,
        },
        draft.body
      )
      if (draftRef.current === draft && noteRef.current?.id === currentNote.id) {
        lastSavedDraftRef.current = draft
      }
    }

    await queryClient.invalidateQueries({ queryKey: ["notes", "local"] })
  }, [clearScheduledSave, queryClient])

  useEffect(() => {
    const noteId = note?.id ?? null
    if (hydratedNoteIdRef.current === noteId) {
      noteRef.current = note
      return
    }

    if (hydratedNoteIdRef.current !== null) {
      void saveDraft()
    }

    hydratedNoteIdRef.current = noteId
    noteRef.current = note

    const nextDraft = {
      noteId: note?.id ?? "",
      title: note?.title ?? "",
      body: note?.body ?? "",
    }

    draftRef.current = nextDraft
    lastSavedDraftRef.current = nextDraft
    setBody(nextDraft.body)
    setTitle(nextDraft.title)
    setStyleState(null)
    clearScheduledSave()
  }, [clearScheduledSave, note, saveDraft])

  useEffect(() => {
    if (!note) {
      return
    }

    const nextDraft = {
      noteId: note.id,
      title,
      body,
    }
    draftRef.current = nextDraft

    const lastSavedDraft = lastSavedDraftRef.current
    if (
      lastSavedDraft?.noteId === nextDraft.noteId &&
      lastSavedDraft.title === nextDraft.title &&
      lastSavedDraft.body === nextDraft.body
    ) {
      return
    }

    clearScheduledSave()
    saveTimeoutRef.current = setTimeout(() => {
      void saveDraft()
    }, AUTOSAVE_DELAY_MS)

    return () => {
      clearScheduledSave()
    }
  }, [body, clearScheduledSave, note, saveDraft, title])

  useEffect(() => {
    return () => {
      void saveDraft()
    }
  }, [saveDraft])

  return (
    <View className="flex-1">
      <NoteHeader
        note={note}
        title={title}
        onBlurTitle={() => {
          void saveDraft()
        }}
        onChangeTitle={setTitle}
      />

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
              key={note.id}
              ref={editorRef}
              defaultValue={note.body}
              markdownStyle={markdownStyle}
              onBlur={() => {
                void saveDraft()
              }}
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
