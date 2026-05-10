import { memo, useEffect, useMemo, useRef } from "react"
import { StyleSheet, View } from "react-native"
import {
  EnrichedMarkdownTextInput,
  type EnrichedMarkdownTextInputInstance,
  type MarkdownTextInputStyle,
} from "react-native-enriched-markdown"
import { KeyboardAvoidingView } from "react-native-keyboard-controller"

import { MarkdownToolbar } from "./MarkdownToolbar"
import { useSafeAreaInsets } from "react-native-safe-area-context"

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
  const insets = useSafeAreaInsets()
  const editorRef = useRef<EnrichedMarkdownTextInputInstance>(null)

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
          defaultValue={defaultBody}
          markdownStyle={markdownStyle}
          onChangeMarkdown={onBodyChange}
          placeholder="Start writing..."
          placeholderTextColor="#71717a"
          selectionColor="#94a3b8"
          style={styles.editor}
        />
        <MarkdownToolbar
          bottomInset={insets.bottom}
          editorRef={editorRef}
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
