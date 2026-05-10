import type { Note } from "@memoneo/shared"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSetAtom } from "jotai"
import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, Alert, View } from "react-native"
import type {
  EnrichedMarkdownTextInputInstance,
  StyleState,
} from "react-native-enriched-markdown"

import { MText } from "@/components/reusables/MText"
import { createLocalNote, writeLocalNote } from "@/lib/notes/local"
import {
  NOTES_LOCAL_QUERY_KEY,
  upsertNoteInLocalQueryCache,
} from "@/lib/notes/query"
import { selectedNoteIdAtom } from "@/lib/notes/state"

import { NoteEditorBody } from "./NoteEditorBody"
import { NoteHeader } from "./NoteHeader"

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

type SaveVariables = {
  note: Note
  draft: DraftSnapshot
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
  const noteRef = useRef<Note | null>(null)
  const draftRef = useRef<DraftSnapshot | null>(null)
  const lastSavedDraftRef = useRef<DraftSnapshot | null>(null)
  const hydratedNoteIdRef = useRef<string | null>(null)
  const queryClient = useQueryClient()
  const setSelectedNoteId = useSetAtom(selectedNoteIdAtom)

  const saveNoteMutation = useMutation({
    mutationFn: async ({ note: currentNote, draft }: SaveVariables) => {
      const nextTitle = draft.title.trim()

      if (currentNote.id === "unsaved") {
        const createdNote = await createLocalNote(
          nextTitle || "Untitled",
          draft.body
        )
        return { kind: "created" as const, note: createdNote, draft }
      }

      const resolvedTitle = nextTitle || currentNote.title || "Untitled"
      const updatedNote: Note = {
        ...currentNote,
        title: resolvedTitle,
        body: draft.body,
        decryptedBody: draft.body,
        updated_at: new Date().toISOString(),
      }
      await writeLocalNote(updatedNote, draft.body)
      return { kind: "updated" as const, note: updatedNote, draft }
    },
    onSuccess: async result => {
      upsertNoteInLocalQueryCache(queryClient, result.note)

      if (result.kind === "created") {
        // Only adopt the new id/draft if the user hasn't switched away mid-save.
        if (
          draftRef.current === result.draft &&
          noteRef.current?.id === "unsaved"
        ) {
          const createdDraft = {
            noteId: result.note.id,
            title: result.note.title,
            body: result.note.body,
          }
          draftRef.current = createdDraft
          lastSavedDraftRef.current = createdDraft
        }
        setSelectedNoteId(result.note.id)
      } else if (
        draftRef.current === result.draft &&
        noteRef.current?.id === result.note.id
      ) {
        lastSavedDraftRef.current = result.draft
      }

      await queryClient.invalidateQueries({ queryKey: NOTES_LOCAL_QUERY_KEY })
    },
    onError: error => {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : String(error)
      )
    },
  })

  const isSaving = saveNoteMutation.isPending

  const handleSave = useCallback(() => {
    const currentNote = noteRef.current
    const draft = draftRef.current
    if (!currentNote || !draft || saveNoteMutation.isPending) {
      return
    }
    saveNoteMutation.mutate({ note: currentNote, draft })
  }, [saveNoteMutation])

  // When the selected note (or its id) changes: sync refs, reset draft/saved snapshots,
  // and hydrate title/body/style from the server note. Same id + new object only updates noteRef.
  useEffect(() => {
    const noteId = note?.id ?? null
    if (hydratedNoteIdRef.current === noteId) {
      noteRef.current = note
      return
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
  }, [note])

  // Keep draftRef aligned with live title/body so saveDraft reads the latest text without stale closures.
  useEffect(() => {
    if (!note) {
      return
    }
    draftRef.current = { noteId: note.id, title, body }
  }, [note, title, body])

  return (
    <View className="flex-1">
      <NoteHeader
        note={note}
        saveDisabled={!note || isSaving}
        title={title}
        onChangeTitle={setTitle}
        onSave={handleSave}
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

      {!isLoading && !error && !note && (
        <View className="flex-1 items-center justify-center px-6">
          <MText className="text-center text-muted-foreground">
            No note selected.
          </MText>
        </View>
      )}

      {!isLoading && !error && note && (
        <NoteEditorBody
          bottomInset={bottomInset}
          defaultBody={note.body}
          editorRef={editorRef}
          noteId={note.id}
          onBodyChange={setBody}
          onStyleStateChange={setStyleState}
          styleState={styleState}
        />
      )}
    </View>
  )
}
