import { useMemo, useRef } from "react"
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

export function NoteEditorBody({
  defaultBody,
  noteId,
  onBodyChange,
}: NoteEditorBodyProps) {
  console.log("NoteEditorBody render")
  const insets = useSafeAreaInsets()
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
