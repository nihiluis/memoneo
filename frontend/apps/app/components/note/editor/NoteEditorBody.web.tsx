import { useEffect, useRef, useState } from "react"
import { View } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import { isSelectionInBoldMarkdown, toggleBoldMarkdown } from "./boldMarkdown"
import { normalizeNoteBody } from "./markdownInputMode"
import { MarkdownToolbar } from "./MarkdownToolbar"

type Props = {
  defaultBody: string
  noteId: string
  onBodyChange: (body: string) => void
}
export function NoteEditorBody({ defaultBody, noteId, onBodyChange }: Props) {
  const [body, setBody] = useState(normalizeNoteBody(defaultBody))
  const [bold, setBold] = useState(false)
  const input = useRef<HTMLTextAreaElement>(null)
  const { isDarkColorScheme } = useColorScheme()
  useEffect(() => {
    setBody(normalizeNoteBody(defaultBody))
  }, [defaultBody, noteId])
  function toggleBold() {
    const field = input.current
    if (!field) return
    const result = toggleBoldMarkdown(body, {
      start: field.selectionStart,
      end: field.selectionEnd,
    })
    setBody(result.body)
    onBodyChange(result.body)
    requestAnimationFrame(() => {
      field.focus()
      field.setSelectionRange(result.selection.start, result.selection.end)
      setBold(isSelectionInBoldMarkdown(result.body, result.selection))
    })
  }
  return (
    <View className="flex-1">
      <textarea
        ref={input}
        aria-label="Note body"
        value={body}
        placeholder="Start writing…"
        onChange={event => {
          const text = normalizeNoteBody(event.target.value)
          setBody(text)
          onBodyChange(text)
        }}
        onSelect={event =>
          setBold(
            isSelectionInBoldMarkdown(body, {
              start: event.currentTarget.selectionStart,
              end: event.currentTarget.selectionEnd,
            })
          )
        }
        onKeyDown={event => {
          if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "b"
          ) {
            event.preventDefault()
            toggleBold()
          }
        }}
        style={{
          flex: 1,
          width: "100%",
          resize: "none",
          border: 0,
          outline: "none",
          boxSizing: "border-box",
          background: "transparent",
          color: isDarkColorScheme ? "#fafafa" : "#18181b",
          fontFamily: "inherit",
          fontSize: 18,
          lineHeight: 1.6,
          padding: "24px 24px 100px",
        }}
      />
      <MarkdownToolbar
        boldActive={bold}
        bottomInset={0}
        onToggleBold={toggleBold}
      />
    </View>
  )
}
