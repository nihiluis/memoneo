import { beforeEach, describe, expect, it, vi } from "vitest"
import { testingLibrary } from "../../../test/react-native-testing"

vi.mock("react-native-keyboard-controller", async () => ({
  KeyboardAvoidingView: (await import("react-native")).View,
}))
vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
vi.mock("@/hooks/useColorScheme", () => ({
  useColorScheme: () => ({ colorScheme: "light" }),
}))
vi.mock("@/hooks/useThemeColor", () => ({ useThemeColor: () => "#18181b" }))
vi.mock("./MarkdownToolbar", () => ({ MarkdownToolbar: () => null }))

const { NoteEditorBody } = await import("./NoteEditorBody")
const { render, fireEvent } = testingLibrary
const longBody = Array.from({ length: 40 }, (_, i) => `Line ${i + 1}`).join("\n")
beforeEach(() => vi.stubGlobal("__DEV__", false))

describe("NoteEditorBody save hydration", () => {
  it("preserves the scrolled draft when saving at the bottom", () => {
    const props = { noteId: "note-1", defaultBody: longBody, onBodyChange: vi.fn() }
    const result = render(<NoteEditorBody {...props} />)
    const draft = `${longBody}\n- `
    const input = () => result.getByPlaceholderText("Start writing...")
    fireEvent.changeText(input(), draft)
    fireEvent(input(), "selectionChange", {
      nativeEvent: { selection: { start: draft.length, end: draft.length } },
    })
    fireEvent(input(), "scroll", { nativeEvent: { contentOffset: { y: 600 } } })
    result.rerender(<NoteEditorBody {...props} defaultBody={draft} />)
    expect(input().props.value).toBe(draft)
    const preview = result.UNSAFE_root.findAll(node => node.props.pointerEvents === "none")[0]
    expect(preview?.props.style).toContainEqual({ transform: [{ translateY: -600 }] })
  })

  it("keeps edits typed while a save is pending", () => {
    const props = { noteId: "note-1", defaultBody: longBody, onBodyChange: vi.fn() }
    const result = render(<NoteEditorBody {...props} />)
    const savedBody = `${longBody}\n- `
    const draft = `${savedBody}more text`
    fireEvent.changeText(result.getByPlaceholderText("Start writing..."), draft)
    result.rerender(<NoteEditorBody {...props} defaultBody={savedBody} />)
    expect(result.getByPlaceholderText("Start writing...").props.value).toBe(draft)
  })

  it("hydrates the body and resets scroll when switching notes", () => {
    const props = { noteId: "note-1", defaultBody: longBody, onBodyChange: vi.fn() }
    const result = render(<NoteEditorBody {...props} />)
    fireEvent(result.getByPlaceholderText("Start writing..."), "scroll", {
      nativeEvent: { contentOffset: { y: 600 } },
    })
    result.rerender(<NoteEditorBody {...props} noteId="note-2" defaultBody="Another note" />)
    expect(result.getByPlaceholderText("Start writing...").props.value).toBe("Another note")
    const preview = result.UNSAFE_root.findAll(node => node.props.pointerEvents === "none")[0]
    expect(preview?.props.style).toContainEqual({ transform: [{ translateY: -0 }] })
  })
})
