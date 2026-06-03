import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  StyleSheet,
  Text,
  TextInput,
  type NativeSyntheticEvent,
  type TextInputScrollEvent,
  type TextInputSelectionChangeEventData,
  View,
} from "react-native"
import { KeyboardAvoidingView } from "react-native-keyboard-controller"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useThemeColor } from "@/hooks/useThemeColor"

import {
  isSelectionInBoldMarkdown,
  parseBoldMarkdownSegments,
  toggleBoldMarkdown,
} from "./boldMarkdown"
import { normalizeNoteBody } from "./markdownInputMode"
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
  const insets = useSafeAreaInsets()
  const editorColor = useThemeColor({}, "text")
  const currentBodyRef = useRef(normalizedDefaultBody)
  const [body, setBody] = useState(normalizedDefaultBody)
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [scrollY, setScrollY] = useState(0)
  const boldSegments = useMemo(() => parseBoldMarkdownSegments(body), [body])
  const boldActive = useMemo(
    () => isSelectionInBoldMarkdown(body, selection),
    [body, selection],
  )

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
    setBody(normalizedDefaultBody)
    setSelection({ start: 0, end: 0 })
    setScrollY(0)
  }, [normalizedDefaultBody, noteId])

  const handleBodyChange = useCallback(
    (nextBody: string) => {
      const normalizedBody = normalizeNoteBody(nextBody)
      currentBodyRef.current = normalizedBody
      setBody(normalizedBody)
      onBodyChange(normalizedBody)
    },
    [onBodyChange],
  )

  const handleSelectionChange = useCallback(
    (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      setSelection(event.nativeEvent.selection)
    },
    [],
  )

  const handleScroll = useCallback((event: TextInputScrollEvent) => {
    setScrollY(event.nativeEvent.contentOffset.y)
  }, [])

  const handleToggleBold = useCallback(() => {
    const result = toggleBoldMarkdown(currentBodyRef.current, selection)
    currentBodyRef.current = result.body
    setBody(result.body)
    setSelection(result.selection)
    onBodyChange(result.body)
  }, [onBodyChange, selection])

  const selectionColor = "#94a3b8"
  const editorTextColor = body ? "rgba(0, 0, 0, 0.01)" : editorColor
  const textInputStyle = useMemo(
    () => [
      styles.editor,
      styles.input,
      {
        color: editorTextColor,
      },
    ],
    [editorTextColor],
  )

  return (
    <KeyboardAvoidingView
      behavior="padding"
      className="flex-1"
      keyboardVerticalOffset={0}>
      <View className="flex-1">
        <Text
          pointerEvents="none"
          style={[
      styles.editor,
      styles.preview,
      { color: editorColor },
      { transform: [{ translateY: -scrollY }] },
    ]}>
          {boldSegments.map((segment, index) => (
            <Text
              key={`${index}-${segment.text}`}
              style={segment.bold && styles.boldText}>
              {segment.text}
            </Text>
          ))}
        </Text>
        <TextInput
          key={noteId}
          multiline
          onChangeText={handleBodyChange}
          onScroll={handleScroll}
          onSelectionChange={handleSelectionChange}
          placeholder="Start writing..."
          placeholderTextColor="#71717a"
          selection={selection}
          selectionColor={selectionColor}
          style={textInputStyle}
          textAlignVertical="top"
          value={body}
        />
        <MarkdownToolbar
          boldActive={boldActive}
          bottomInset={insets.bottom}
          onToggleBold={handleToggleBold}
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
    lineHeight: 24,
    backgroundColor: "transparent",
    textAlignVertical: "top",
  },
  input: {
    zIndex: 1,
  },
  preview: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 0,
  },
  boldText: {
    fontWeight: "700",
  },
})
