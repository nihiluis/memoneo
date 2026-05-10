import type { Note } from "@memoneo/shared"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAtomValue, useSetAtom } from "jotai"
import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, Alert, View } from "react-native"

import { MText } from "@/components/reusables/MText"
import { createLocalNote, writeLocalNote } from "@/lib/notes/local"
import {
  NOTES_LOCAL_QUERY_KEY,
  upsertNoteInLocalQueryCache,
} from "@/lib/notes/query"
import { selectedNoteAtom, selectedNoteIdAtom, useNotesState } from "@/lib/notes/state"

import { NoteEditorBody } from "./NoteEditorBody"
import { NoteHeader } from "./NoteHeader"

type DraftSnapshot = {
  noteId: string
  title: string
  body: string
}

type SaveVariables = {
  note: Note
  draft: DraftSnapshot
}

function draftsEqual(a: DraftSnapshot, b: DraftSnapshot) {
  return a.noteId === b.noteId && a.title === b.title && a.body === b.body
}

export function NoteReader() {
  const { error, isLoading } = useNotesState()
  const note = useAtomValue(selectedNoteAtom)

  const [title, setTitle] = useState("")
  const noteRef = useRef<Note | null>(null)
  const titleRef = useRef("")
  const bodyRef = useRef("")
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
        const n = noteRef.current
        const currentDraft: DraftSnapshot | null = n
          ? { noteId: n.id, title: titleRef.current, body: bodyRef.current }
          : null
        // Only sync local title/body if the user hasn't edited since this save.
        if (
          currentDraft &&
          draftsEqual(currentDraft, result.draft) &&
          n?.id === "unsaved"
        ) {
          bodyRef.current = result.note.body
          titleRef.current = result.note.title
          setTitle(result.note.title)
        }
        setSelectedNoteId(result.note.id)
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
    if (!currentNote || saveNoteMutation.isPending) {
      return
    }
    const draft: DraftSnapshot = {
      noteId: currentNote.id,
      title: titleRef.current,
      body: bodyRef.current,
    }
    saveNoteMutation.mutate({ note: currentNote, draft })
  }, [saveNoteMutation])

  const handleChangeTitle = useCallback((nextTitle: string) => {
    setTitle(nextTitle)
    titleRef.current = nextTitle
  }, [])

  const handleBodyChange = useCallback((nextBody: string) => {
    bodyRef.current = nextBody
  }, [])

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

    const nextTitle = note?.title ?? ""
    const nextBody = note?.body ?? ""

    titleRef.current = nextTitle
    bodyRef.current = nextBody
    setTitle(nextTitle)
  }, [note])

  return (
    <View className="flex-1">
      <NoteHeader
        note={note}
        saveDisabled={!note || isSaving}
        title={title}
        onChangeTitle={handleChangeTitle}
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
          defaultBody={note.body}
          noteId={note.id}
          onBodyChange={handleBodyChange}
        />
      )}
    </View>
  )
}
