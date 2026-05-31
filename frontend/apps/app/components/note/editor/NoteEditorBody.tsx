import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { StyleSheet, View } from "react-native"
import {
  EnrichedMarkdownTextInput,
  type EnrichedMarkdownTextInputInstance,
  type MarkdownTextInputStyle,
} from "react-native-enriched-markdown"
import { KeyboardAvoidingView } from "react-native-keyboard-controller"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import {
  escapeMarkdownForPlainEditing,
  normalizeNoteBody,
  shouldEditAsPlainMarkdown,
} from "./markdownInputMode"
import { MarkdownToolbar } from "./MarkdownToolbar"

type NoteEditorBodyProps = {
  defaultBody: string
  noteId: string
  onBodyChange: (body: string) => void
}

function areNoteEditorBodyPropsEqual(
  prev: NoteEditorBodyProps,
  next: NoteEditorBodyProps,
): boolean {
  const defaultBodyEq = prev.defaultBody === next.defaultBody
  const noteIdEq = prev.noteId === next.noteId
  const onBodyChangeEq = prev.onBodyChange === next.onBodyChange
  if (defaultBodyEq && noteIdEq && onBodyChangeEq) {
    return true
  }
  if (__DEV__) {
    console.log("NoteEditorBody memo: props changed (re-render)", {
      defaultBody: defaultBodyEq,
      noteId: noteIdEq,
      onBodyChange: onBodyChangeEq,
    })
  }
  return false
}

function NoteEditorBodyComponent({
  defaultBody,
  noteId,
  onBodyChange,
}: NoteEditorBodyProps) {
  if (__DEV__) {
    console.log("NoteEditorBody render", JSON.stringify({ defaultBody, noteId }))
  }
  const normalizedDefaultBody = useMemo(
    () => normalizeNoteBody(defaultBody),
    [defaultBody],
  )
  const editAsPlainMarkdown = useMemo(
    () => shouldEditAsPlainMarkdown(normalizedDefaultBody),
    [normalizedDefaultBody],
  )
  const editorDefaultValue = useMemo(
    () =>
      editAsPlainMarkdown
        ? escapeMarkdownForPlainEditing(normalizedDefaultBody)
        : normalizedDefaultBody,
    [editAsPlainMarkdown, normalizedDefaultBody],
  )
  const insets = useSafeAreaInsets()
  const editorRef = useRef<EnrichedMarkdownTextInputInstance>(null)
  const currentBodyRef = useRef(normalizedDefaultBody)
  const [selection, setSelection] = useState({ start: 0, end: 0 })

  useEffect(() => {
    if (__DEV__) {
      console.log("NoteEditorBody mount", noteId)
    }
    return () => {
      if (__DEV__) {
        console.log("NoteEditorBody unmount", noteId)
      }
    }
  }, [noteId])

  useEffect(() => {
    currentBodyRef.current = normalizedDefaultBody
    setSelection({ start: 0, end: 0 })
  }, [normalizedDefaultBody, noteId])

  const handlePlainMarkdownChange = useCallback(
    (nextBody: string) => {
      const normalizedBody = normalizeNoteBody(nextBody)
      currentBodyRef.current = normalizedBody
      onBodyChange(normalizedBody)
    },
    [onBodyChange],
  )

  const applyPlainMarkdownDelimiter = useCallback(
    (delimiter: string) => {
      const body = currentBodyRef.current
      const start = Math.max(0, Math.min(selection.start, body.length))
      const end = Math.max(start, Math.min(selection.end, body.length))
      const selectedText = body.slice(start, end)
      const nextBody =
        body.slice(0, start) +
        delimiter +
        selectedText +
        delimiter +
        body.slice(end)
      const nextSelection = selectedText
        ? {
            start: start + delimiter.length,
            end: end + delimiter.length,
          }
        : {
            start: start + delimiter.length,
            end: start + delimiter.length,
          }

      currentBodyRef.current = nextBody
      onBodyChange(nextBody)
      editorRef.current?.setValue(escapeMarkdownForPlainEditing(nextBody))
      setSelection(nextSelection)
      setTimeout(() => {
        editorRef.current?.setSelection(nextSelection.start, nextSelection.end)
      }, 0)
    },
    [onBodyChange, selection],
  )

  const plainMarkdownActions = useMemo(
    () =>
      editAsPlainMarkdown
        ? {
            bold: () => applyPlainMarkdownDelimiter("**"),
            italic: () => applyPlainMarkdownDelimiter("*"),
            strikethrough: () => applyPlainMarkdownDelimiter("~~"),
            underline: () => applyPlainMarkdownDelimiter("_"),
          }
        : undefined,
    [applyPlainMarkdownDelimiter, editAsPlainMarkdown],
  )

  const markdownStyle: MarkdownTextInputStyle = useMemo(
    () => ({
      strong: { color: "#f8fafc" },
      em: { color: "#f8fafc" },
      link: { color: "#60a5fa", underline: true },
      lineHeight: 24,
    }),
    [],
  )

  return (
    <KeyboardAvoidingView
      behavior="padding"
      className="flex-1"
      keyboardVerticalOffset={0}>
      <View className="flex-1">
        <EnrichedMarkdownTextInput
          key={noteId}
          ref={editorRef}
          defaultValue={editorDefaultValue}
          markdownStyle={markdownStyle}
          onChangeMarkdown={editAsPlainMarkdown ? undefined : onBodyChange}
          onChangeSelection={setSelection}
          onChangeText={
            editAsPlainMarkdown ? handlePlainMarkdownChange : undefined
          }
          placeholder="Start writing..."
          placeholderTextColor="#71717a"
          selectionColor="#94a3b8"
          style={styles.editor}
        />
        <MarkdownToolbar
          bottomInset={insets.bottom}
          editorRef={editorRef}
          plainMarkdownActions={plainMarkdownActions}
          styleState={null}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

export const NoteEditorBody = memo(
  NoteEditorBodyComponent,
  areNoteEditorBodyPropsEqual,
)

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
